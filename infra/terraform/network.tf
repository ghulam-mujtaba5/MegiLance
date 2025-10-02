resource "aws_vpc" "main" {
  cidr_block = var.cidr_vpc
  tags = {
    Name = "${var.project_prefix}-vpc"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "${var.project_prefix}-igw" }
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_subnet" "public" {
  for_each = toset(var.public_subnets)
  vpc_id = aws_vpc.main.id
  cidr_block = each.value
  availability_zone = element(data.aws_availability_zones.available.names, index(var.public_subnets, each.value))
  tags = { Name = "${var.project_prefix}-public-${cidrsubnet(each.value, 8, 0)}" }
}

resource "aws_subnet" "private" {
  for_each = toset(var.private_subnets)
  vpc_id = aws_vpc.main.id
  cidr_block = each.value
  availability_zone = element(data.aws_availability_zones.available.names, index(var.private_subnets, each.value))
  tags = { Name = "${var.project_prefix}-private-${cidrsubnet(each.value, 8, 0)}" }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "${var.project_prefix}-public-rt" }
}

resource "aws_route" "public_internet_access" {
  route_table_id = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc" {
  for_each = aws_subnet.public
  subnet_id = each.value.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_eip" "nat" {
  # Elastic IP for NAT gateway
  depends_on = [aws_internet_gateway.igw]
}

resource "aws_nat_gateway" "gw" {
  allocation_id = aws_eip.nat.id
  # pick the first created public subnet for the NAT gateway
  subnet_id     = tolist(values(aws_subnet.public))[0].id
  tags = { Name = "${var.project_prefix}-nat" }
  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "${var.project_prefix}-private-rt" }
}

resource "aws_route" "private_outbound" {
  route_table_id = aws_route_table.private_rt.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id = aws_nat_gateway.gw.id
}

resource "aws_route_table_association" "private_assoc" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private_rt.id
}

# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_prefix}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.cidr_vpc]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_prefix}-vpc-endpoints-sg"
  }
}

# VPC Endpoint for Secrets Manager - CRITICAL for ECS to pull secrets
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [for s in aws_subnet.private : s.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_prefix}-secretsmanager-endpoint"
  }
}

# VPC Endpoint for ECR API - Helps ECS pull images
resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [for s in aws_subnet.private : s.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_prefix}-ecr-api-endpoint"
  }
}

# VPC Endpoint for ECR Docker - Required for ECS to pull images
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [for s in aws_subnet.private : s.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_prefix}-ecr-dkr-endpoint"
  }
}

# VPC Endpoint for S3 - Required for ECR to work
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private_rt.id]

  tags = {
    Name = "${var.project_prefix}-s3-endpoint"
  }
}

# VPC Endpoint for CloudWatch Logs - For ECS logging
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [for s in aws_subnet.private : s.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_prefix}-logs-endpoint"
  }
}
 
