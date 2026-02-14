# @AI-HINT: Pakistan-friendly payment gateway supporting USDC (Polygon), AirTM, JazzCash, EasyPaisa, Wise
"""Pakistan Payment Gateway Service."""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from decimal import Decimal
from pydantic import BaseModel, Field
from enum import Enum
import os
import httpx
import json
import secrets


# ============================================================================
# Network Configuration (Testnet = FREE, Mainnet = Real money)
# ============================================================================

class NetworkMode:
    """Network configuration for crypto payments"""
    # Set to True for FREE testing, False for production
    USE_TESTNET = os.getenv("CRYPTO_USE_TESTNET", "true").lower() == "true"
    
    # Polygon Networks
    POLYGON_MAINNET = {
        "name": "Polygon Mainnet",
        "chain_id": 137,
        "rpc_url": "https://polygon-rpc.com/",
        "explorer": "https://polygonscan.com",
        "usdc_address": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",  # Native USDC
    }
    
    POLYGON_TESTNET = {
        "name": "Polygon Amoy Testnet",  # New testnet (Mumbai deprecated)
        "chain_id": 80002,
        "rpc_url": "https://rpc-amoy.polygon.technology/",
        "explorer": "https://amoy.polygonscan.com",
        "usdc_address": "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",  # Test USDC
        "faucet": "https://faucet.polygon.technology/",  # FREE test tokens!
    }
    
    @classmethod
    def get_polygon_config(cls):
        """Get current Polygon network config"""
        return cls.POLYGON_TESTNET if cls.USE_TESTNET else cls.POLYGON_MAINNET


# ============================================================================
# Enums & Models
# ============================================================================

class PakistanPaymentProvider(str, Enum):
    """Available payment providers in Pakistan"""
    USDC_POLYGON = "usdc_polygon"      # RECOMMENDED - lowest fees (FREE on testnet!)
    USDC_ETHEREUM = "usdc_ethereum"    # Higher fees, more liquidity
    AIRTM = "airtm"                    # P2P exchange
    JAZZCASH = "jazzcash"              # Mobile wallet
    EASYPAISA = "easypaisa"            # Mobile wallet
    WISE = "wise"                      # Bank transfer
    PAYONEER = "payoneer"              # Freelancer platform
    BANK_TRANSFER = "bank_transfer"   # Direct PKR bank


class PaymentProviderConfig(BaseModel):
    """Configuration for a payment provider"""
    provider: PakistanPaymentProvider
    display_name: str
    icon: str  # Icon name for frontend
    enabled: bool = True
    min_amount_usd: Decimal = Decimal("1.00")
    max_amount_usd: Decimal = Decimal("10000.00")
    fee_percent: Decimal
    fee_fixed_usd: Decimal = Decimal("0.00")
    estimated_time: str
    countries: List[str] = ["PK"]  # Pakistan
    requires_verification: bool = False
    instructions: str = ""


class WalletConnection(BaseModel):
    """Crypto wallet connection details"""
    user_id: int
    wallet_address: str
    network: str = "polygon"  # polygon, ethereum, bsc
    is_verified: bool = False
    connected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaymentRequest(BaseModel):
    """Payment request for Pakistan providers"""
    user_id: int
    recipient_id: Optional[int] = None
    amount: Decimal
    currency: str = "USD"
    provider: PakistanPaymentProvider
    wallet_address: Optional[str] = None
    mobile_number: Optional[str] = None
    bank_account: Optional[str] = None
    description: Optional[str] = None
    contract_id: Optional[int] = None


class PaymentResponse(BaseModel):
    """Payment response"""
    success: bool
    transaction_id: Optional[str] = None
    status: str = "pending"
    provider: str
    amount: Decimal
    fee: Decimal
    net_amount: Decimal
    message: str = ""
    redirect_url: Optional[str] = None
    qr_code: Optional[str] = None
    instructions: Optional[str] = None
    tx_hash: Optional[str] = None  # For crypto
    block_explorer_url: Optional[str] = None


# ============================================================================
# Provider Configurations
# ============================================================================

PAKISTAN_PROVIDERS: Dict[PakistanPaymentProvider, PaymentProviderConfig] = {
    PakistanPaymentProvider.USDC_POLYGON: PaymentProviderConfig(
        provider=PakistanPaymentProvider.USDC_POLYGON,
        display_name="USDC (Polygon)",
        icon="polygon",
        fee_percent=Decimal("0.1"),  # 0.1% - our platform fee
        fee_fixed_usd=Decimal("0.01"),  # ~$0.01 gas on Polygon
        estimated_time="2-5 minutes",
        requires_verification=False,
        instructions="""
**USDC on Polygon - Recommended for Pakistan! 🚀**

1. Install MetaMask browser extension or mobile app
2. Add Polygon network to MetaMask
3. Get USDC on Polygon from exchanges like Binance, Bybit, or OKX
4. Connect your wallet and pay instantly!

**Why Polygon?**
- Near-zero fees (~$0.01 per transaction)
- Fast confirmations (2-5 seconds)
- USDC is stablecoin pegged to USD
- Works globally without restrictions
"""
    ),
    
    PakistanPaymentProvider.USDC_ETHEREUM: PaymentProviderConfig(
        provider=PakistanPaymentProvider.USDC_ETHEREUM,
        display_name="USDC (Ethereum)",
        icon="ethereum",
        fee_percent=Decimal("0.1"),
        fee_fixed_usd=Decimal("5.00"),  # Higher gas fees
        estimated_time="5-15 minutes",
        requires_verification=False,
        instructions="Pay with USDC on Ethereum mainnet. Higher fees but more liquidity."
    ),
    
    PakistanPaymentProvider.AIRTM: PaymentProviderConfig(
        provider=PakistanPaymentProvider.AIRTM,
        display_name="AirTM",
        icon="airtm",
        fee_percent=Decimal("2.0"),
        estimated_time="15-30 minutes",
        requires_verification=True,
        instructions="""
**AirTM - P2P Exchange Platform**

1. Create account at airtm.com
2. Verify your identity (KYC)
3. Add PKR via bank transfer or JazzCash
4. Exchange PKR to USD on AirTM
5. Pay to MegiLance AirTM account

AirTM supports:
- Bank transfers (PKR)
- JazzCash
- EasyPaisa
- Cryptocurrency
"""
    ),
    
    PakistanPaymentProvider.JAZZCASH: PaymentProviderConfig(
        provider=PakistanPaymentProvider.JAZZCASH,
        display_name="JazzCash",
        icon="jazzcash",
        fee_percent=Decimal("1.5"),
        estimated_time="Instant",
        min_amount_usd=Decimal("5.00"),
        max_amount_usd=Decimal("500.00"),  # JazzCash limits
        requires_verification=True,
        instructions="""
**JazzCash Mobile Payment**

1. Open JazzCash app
2. Select "Send Money"
3. Enter merchant code or scan QR
4. Enter amount in PKR
5. Confirm with PIN

**Note:** Converted from USD to PKR at market rate.
"""
    ),
    
    PakistanPaymentProvider.EASYPAISA: PaymentProviderConfig(
        provider=PakistanPaymentProvider.EASYPAISA,
        display_name="EasyPaisa",
        icon="easypaisa",
        fee_percent=Decimal("1.5"),
        estimated_time="Instant",
        min_amount_usd=Decimal("5.00"),
        max_amount_usd=Decimal("500.00"),
        requires_verification=True,
        instructions="""
**EasyPaisa Mobile Payment**

1. Open EasyPaisa app
2. Select "Send Money"
3. Enter merchant details or scan QR
4. Enter amount in PKR
5. Confirm transaction

**Note:** Converted from USD to PKR at market rate.
"""
    ),
    
    PakistanPaymentProvider.WISE: PaymentProviderConfig(
        provider=PakistanPaymentProvider.WISE,
        display_name="Wise (TransferWise)",
        icon="wise",
        fee_percent=Decimal("0.5"),
        fee_fixed_usd=Decimal("1.00"),
        estimated_time="1-2 business days",
        requires_verification=True,
        instructions="""
**Wise International Transfer**

1. Create Wise account at wise.com
2. Verify identity (takes ~24 hours)
3. Add PKR bank account
4. Send USD to MegiLance Wise account
5. Receive confirmation

Wise offers the best exchange rates!
"""
    ),
    
    PakistanPaymentProvider.PAYONEER: PaymentProviderConfig(
        provider=PakistanPaymentProvider.PAYONEER,
        display_name="Payoneer",
        icon="payoneer",
        fee_percent=Decimal("2.0"),
        estimated_time="Instant",
        requires_verification=True,
        instructions="""
**Payoneer - Popular for Freelancers**

1. Sign up at payoneer.com
2. Get verified (takes 1-3 days)
3. Receive payments to your Payoneer account
4. Transfer between Payoneer users free!
5. Withdraw to Pakistani bank at low rates

Many Pakistani freelancers already use Payoneer!
"""
    ),
    
    PakistanPaymentProvider.BANK_TRANSFER: PaymentProviderConfig(
        provider=PakistanPaymentProvider.BANK_TRANSFER,
        display_name="Pakistani Bank Transfer",
        icon="bank",
        fee_percent=Decimal("0.5"),
        fee_fixed_usd=Decimal("5.00"),
        estimated_time="1-3 business days",
        requires_verification=True,
        instructions="""
**Direct Bank Transfer (PKR)**

Supported Banks:
- HBL (Habib Bank Limited)
- UBL (United Bank Limited)
- MCB Bank
- Bank Alfalah
- Meezan Bank

Transfer to our PKR account and provide receipt.
"""
    ),
}


# ============================================================================
# Pakistan Payment Service
# ============================================================================

class PakistanPaymentService:
    """Service for handling Pakistan-friendly payments"""
    
    # Mock state for development
    _mock_wallets: Dict[int, WalletConnection] = {}
    _mock_transactions: Dict[str, Dict[str, Any]] = {}
    
    def __init__(self):
        # Exchange rate (would fetch from API in production)
        self.pkr_usd_rate = Decimal("278.50")  # 1 USD = 278.50 PKR
        
    def get_available_providers(self, country: str = "PK") -> List[PaymentProviderConfig]:
        """Get available payment providers for a country"""
        providers = []
        for provider in PAKISTAN_PROVIDERS.values():
            if country in provider.countries and provider.enabled:
                providers.append(provider)
        return providers
    
    def get_provider_config(self, provider: PakistanPaymentProvider) -> PaymentProviderConfig:
        """Get configuration for a specific provider"""
        return PAKISTAN_PROVIDERS.get(provider)
    
    def calculate_fee(
        self, 
        amount: Decimal, 
        provider: PakistanPaymentProvider
    ) -> Dict[str, Decimal]:
        """Calculate fees for a payment"""
        config = self.get_provider_config(provider)
        if not config:
            raise ValueError(f"Unknown provider: {provider}")
        
        percentage_fee = amount * (config.fee_percent / 100)
        total_fee = percentage_fee + config.fee_fixed_usd
        net_amount = amount - total_fee
        
        return {
            "amount": amount,
            "fee_percent": percentage_fee,
            "fee_fixed": config.fee_fixed_usd,
            "total_fee": total_fee,
            "net_amount": net_amount
        }
    
    def usd_to_pkr(self, usd_amount: Decimal) -> Decimal:
        """Convert USD to PKR"""
        return usd_amount * self.pkr_usd_rate
    
    def pkr_to_usd(self, pkr_amount: Decimal) -> Decimal:
        """Convert PKR to USD"""
        return pkr_amount / self.pkr_usd_rate
    
    # ========================================================================
    # Wallet Management
    # ========================================================================
    
    async def connect_wallet(
        self,
        user_id: int,
        wallet_address: str,
        network: str = "polygon",
        signature: Optional[str] = None  # For verification
    ) -> WalletConnection:
        """Connect a crypto wallet to user account"""
        # Validate wallet address format
        if not wallet_address.startswith("0x") or len(wallet_address) != 42:
            raise ValueError("Invalid wallet address format")
        
        connection = WalletConnection(
            user_id=user_id,
            wallet_address=wallet_address.lower(),
            network=network,
            is_verified=signature is not None,  # Would verify signature in production
        )
        
        # Store connection (would save to database in production)
        self._mock_wallets[user_id] = connection
        
        return connection
    
    async def get_wallet(self, user_id: int) -> Optional[WalletConnection]:
        """Get user's connected wallet"""
        return self._mock_wallets.get(user_id)
    
    async def disconnect_wallet(self, user_id: int) -> bool:
        """Disconnect user's wallet"""
        if user_id in self._mock_wallets:
            del self._mock_wallets[user_id]
            return True
        return False
    
    # ========================================================================
    # USDC Payments (Polygon/Ethereum)
    # ========================================================================
    
    async def process_usdc_payment(
        self,
        request: PaymentRequest
    ) -> PaymentResponse:
        """Process USDC payment on Polygon or Ethereum"""
        network = "polygon" if request.provider == PakistanPaymentProvider.USDC_POLYGON else "ethereum"
        
        fees = self.calculate_fee(request.amount, request.provider)
        
        # Get network configuration (testnet or mainnet)
        is_testnet = NetworkMode.USE_TESTNET
        polygon_config = NetworkMode.get_polygon_config()
        
        # Generate payment address (in production, generate unique per-transaction)
        receiving_address = os.getenv(
            f"USDC_RECEIVING_ADDRESS_{network.upper()}", 
            "0x742d35Cc6634C0532925a3b844Bc9e7595f1E123"  # Demo address
        )
        
        # Create transaction record
        tx_id = f"usdc_{network}_{secrets.token_hex(8)}"
        
        self._mock_transactions[tx_id] = {
            "id": tx_id,
            "provider": request.provider.value,
            "status": "pending",
            "amount": str(request.amount),
            "fee": str(fees["total_fee"]),
            "net_amount": str(fees["net_amount"]),
            "receiving_address": receiving_address,
            "network": network,
            "is_testnet": is_testnet,
            "chain_id": polygon_config["chain_id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Block explorer URLs
        explorer_base = polygon_config["explorer"]
        
        # Testnet-specific instructions
        testnet_note = ""
        if is_testnet:
            testnet_note = f"""
⚠️ **TESTNET MODE - NO REAL MONEY!**

Get FREE test tokens:
1. Visit {polygon_config.get('faucet', 'https://faucet.polygon.technology/')}
2. Enter your wallet address
3. Receive free test MATIC & USDC

Network: **{polygon_config['name']}**
Chain ID: **{polygon_config['chain_id']}**
"""
        
        return PaymentResponse(
            success=True,
            transaction_id=tx_id,
            status="awaiting_payment",
            provider=request.provider.value,
            amount=request.amount,
            fee=fees["total_fee"],
            net_amount=fees["net_amount"],
            message=f"Send {request.amount} USDC to the address below on {polygon_config['name']}",
            instructions=f"""
{testnet_note}
**Payment Instructions:**

1. Open MetaMask or your Web3 wallet
2. Make sure you're on **{polygon_config['name']}** (Chain ID: {polygon_config['chain_id']})
3. Send exactly **{request.amount} USDC** to:

`{receiving_address}`

4. Wait for confirmation (usually 2-5 minutes)
5. Your payment will be automatically detected!

**Important:**
- Only send USDC on {polygon_config['name']}
- Double-check the address before sending
- {'This is TESTNET - no real money involved!' if is_testnet else 'Transaction is irreversible'}
""",
            block_explorer_url=f"{explorer_base}/address/{receiving_address}"
        )
    
    async def verify_usdc_transaction(
        self,
        transaction_id: str,
        tx_hash: str
    ) -> PaymentResponse:
        """Verify a USDC transaction on blockchain"""
        tx = self._mock_transactions.get(transaction_id)
        if not tx:
            raise ValueError("Transaction not found")
        
        # In production, would verify on blockchain using web3.py
        # For now, simulate verification
        tx["status"] = "confirmed"
        tx["tx_hash"] = tx_hash
        tx["confirmed_at"] = datetime.now(timezone.utc).isoformat()
        
        network = tx.get("network", "polygon")
        explorer_base = "https://polygonscan.com" if network == "polygon" else "https://etherscan.io"
        
        return PaymentResponse(
            success=True,
            transaction_id=transaction_id,
            status="confirmed",
            provider=tx["provider"],
            amount=Decimal(tx["amount"]),
            fee=Decimal(tx["fee"]),
            net_amount=Decimal(tx["net_amount"]),
            message="Payment confirmed successfully!",
            tx_hash=tx_hash,
            block_explorer_url=f"{explorer_base}/tx/{tx_hash}"
        )
    
    # ========================================================================
    # Mobile Wallet Payments (JazzCash / EasyPaisa)
    # ========================================================================
    
    async def process_mobile_payment(
        self,
        request: PaymentRequest
    ) -> PaymentResponse:
        """Process JazzCash or EasyPaisa payment"""
        provider_name = "JazzCash" if request.provider == PakistanPaymentProvider.JAZZCASH else "EasyPaisa"
        
        fees = self.calculate_fee(request.amount, request.provider)
        pkr_amount = self.usd_to_pkr(request.amount)
        
        tx_id = f"{request.provider.value}_{secrets.token_hex(8)}"
        
        # Merchant details (would be configured in production)
        merchant_code = os.getenv(f"{request.provider.value.upper()}_MERCHANT_CODE", "MEGILANCE001")
        
        self._mock_transactions[tx_id] = {
            "id": tx_id,
            "provider": request.provider.value,
            "status": "pending",
            "amount_usd": str(request.amount),
            "amount_pkr": str(pkr_amount),
            "merchant_code": merchant_code,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return PaymentResponse(
            success=True,
            transaction_id=tx_id,
            status="awaiting_payment",
            provider=request.provider.value,
            amount=request.amount,
            fee=fees["total_fee"],
            net_amount=fees["net_amount"],
            message=f"Pay PKR {pkr_amount:,.2f} via {provider_name}",
            instructions=f"""
**{provider_name} Payment Instructions:**

1. Open your {provider_name} app
2. Select "Send Money" or "Pay Merchant"
3. Enter merchant code: **{merchant_code}**
4. Enter amount: **PKR {pkr_amount:,.2f}**
5. Add reference: **{tx_id}**
6. Confirm with your PIN

Your payment will be verified within 5 minutes!

**Exchange Rate:** 1 USD = PKR {self.pkr_usd_rate}
"""
        )
    
    # ========================================================================
    # AirTM Payments
    # ========================================================================
    
    async def process_airtm_payment(
        self,
        request: PaymentRequest
    ) -> PaymentResponse:
        """Process AirTM payment"""
        fees = self.calculate_fee(request.amount, request.provider)
        
        tx_id = f"airtm_{secrets.token_hex(8)}"
        airtm_email = os.getenv("AIRTM_RECEIVING_EMAIL", "payments@megilance.com")
        
        self._mock_transactions[tx_id] = {
            "id": tx_id,
            "provider": "airtm",
            "status": "pending",
            "amount": str(request.amount),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return PaymentResponse(
            success=True,
            transaction_id=tx_id,
            status="awaiting_payment",
            provider="airtm",
            amount=request.amount,
            fee=fees["total_fee"],
            net_amount=fees["net_amount"],
            message=f"Send ${request.amount} USD via AirTM",
            redirect_url="https://airtm.com/send",
            instructions=f"""
**AirTM Payment Instructions:**

1. Log in to your AirTM account at airtm.com
2. Click "Send Dollars"
3. Enter recipient email: **{airtm_email}**
4. Enter amount: **${request.amount} USD**
5. Add reference: **{tx_id}**
6. Confirm the transfer

**Don't have AirTM?**
- Sign up at airtm.com (free)
- Deposit PKR via bank transfer or JazzCash
- Convert PKR to USD at competitive rates
- Send to MegiLance instantly!

Verification typically takes 15-30 minutes.
"""
        )
    
    # ========================================================================
    # Wise / Payoneer Payments
    # ========================================================================
    
    async def process_wise_payment(
        self,
        request: PaymentRequest
    ) -> PaymentResponse:
        """Process Wise (TransferWise) payment"""
        fees = self.calculate_fee(request.amount, request.provider)
        
        tx_id = f"wise_{secrets.token_hex(8)}"
        
        # Wise receiving details (would be configured in production)
        wise_email = os.getenv("WISE_RECEIVING_EMAIL", "payments@megilance.com")
        
        self._mock_transactions[tx_id] = {
            "id": tx_id,
            "provider": "wise",
            "status": "pending",
            "amount": str(request.amount),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return PaymentResponse(
            success=True,
            transaction_id=tx_id,
            status="awaiting_payment",
            provider="wise",
            amount=request.amount,
            fee=fees["total_fee"],
            net_amount=fees["net_amount"],
            message=f"Send ${request.amount} USD via Wise",
            redirect_url="https://wise.com/send",
            instructions=f"""
**Wise Payment Instructions:**

1. Log in to wise.com
2. Click "Send money"
3. Select USD as currency
4. Enter amount: **${request.amount}**
5. Send to email: **{wise_email}**
6. Add reference: **{tx_id}**
7. Complete the transfer

**Why Wise?**
- Best exchange rates (mid-market rate)
- Low transparent fees
- Fast transfers (1-2 days)
- Trusted by millions globally

First time? Sign up at wise.com (free account)
"""
        )
    
    async def process_payoneer_payment(
        self,
        request: PaymentRequest
    ) -> PaymentResponse:
        """Process Payoneer payment"""
        fees = self.calculate_fee(request.amount, request.provider)
        
        tx_id = f"payoneer_{secrets.token_hex(8)}"
        payoneer_email = os.getenv("PAYONEER_RECEIVING_EMAIL", "payments@megilance.com")
        
        self._mock_transactions[tx_id] = {
            "id": tx_id,
            "provider": "payoneer",
            "status": "pending",
            "amount": str(request.amount),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return PaymentResponse(
            success=True,
            transaction_id=tx_id,
            status="awaiting_payment",
            provider="payoneer",
            amount=request.amount,
            fee=fees["total_fee"],
            net_amount=fees["net_amount"],
            message=f"Send ${request.amount} USD via Payoneer",
            redirect_url="https://myaccount.payoneer.com/ma/transfer",
            instructions=f"""
**Payoneer Payment Instructions:**

1. Log in to myaccount.payoneer.com
2. Click "Make a Payment"
3. Select "Pay a business or freelancer"
4. Enter email: **{payoneer_email}**
5. Enter amount: **${request.amount} USD**
6. Add reference: **{tx_id}**
7. Confirm payment

**Payoneer Benefits for Pakistan:**
- FREE transfers between Payoneer users
- Withdraw to Pakistani banks at low rates
- Multi-currency account
- Most Pakistani freelancers already have it!

New to Payoneer? Sign up at payoneer.com
"""
        )
    
    # ========================================================================
    # Main Payment Router
    # ========================================================================
    
    async def process_payment(
        self,
        request: PaymentRequest
    ) -> PaymentResponse:
        """Route payment to appropriate provider"""
        
        # Validate provider
        if request.provider not in PAKISTAN_PROVIDERS:
            return PaymentResponse(
                success=False,
                provider=request.provider.value if request.provider else "unknown",
                amount=request.amount,
                fee=Decimal("0"),
                net_amount=request.amount,
                status="error",
                message=f"Unsupported payment provider: {request.provider}"
            )
        
        config = self.get_provider_config(request.provider)
        
        # Validate amount
        if request.amount < config.min_amount_usd:
            return PaymentResponse(
                success=False,
                provider=request.provider.value,
                amount=request.amount,
                fee=Decimal("0"),
                net_amount=request.amount,
                status="error",
                message=f"Minimum amount is ${config.min_amount_usd}"
            )
        
        if request.amount > config.max_amount_usd:
            return PaymentResponse(
                success=False,
                provider=request.provider.value,
                amount=request.amount,
                fee=Decimal("0"),
                net_amount=request.amount,
                status="error",
                message=f"Maximum amount is ${config.max_amount_usd}"
            )
        
        # Route to appropriate handler
        handlers = {
            PakistanPaymentProvider.USDC_POLYGON: self.process_usdc_payment,
            PakistanPaymentProvider.USDC_ETHEREUM: self.process_usdc_payment,
            PakistanPaymentProvider.AIRTM: self.process_airtm_payment,
            PakistanPaymentProvider.JAZZCASH: self.process_mobile_payment,
            PakistanPaymentProvider.EASYPAISA: self.process_mobile_payment,
            PakistanPaymentProvider.WISE: self.process_wise_payment,
            PakistanPaymentProvider.PAYONEER: self.process_payoneer_payment,
        }
        
        handler = handlers.get(request.provider)
        if handler:
            return await handler(request)
        
        return PaymentResponse(
            success=False,
            provider=request.provider.value,
            amount=request.amount,
            fee=Decimal("0"),
            net_amount=request.amount,
            status="error",
            message="Payment handler not implemented"
        )
    
    async def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """Get status of a transaction"""
        tx = self._mock_transactions.get(transaction_id)
        if not tx:
            return {"error": "Transaction not found", "status": "not_found"}
        return tx


# ============================================================================
# Service Factory
# ============================================================================

# Singleton instance
_pakistan_payment_service: Optional[PakistanPaymentService] = None

def get_pakistan_payment_service() -> PakistanPaymentService:
    """Get Pakistan payment service instance"""
    global _pakistan_payment_service
    if _pakistan_payment_service is None:
        _pakistan_payment_service = PakistanPaymentService()
    return _pakistan_payment_service
