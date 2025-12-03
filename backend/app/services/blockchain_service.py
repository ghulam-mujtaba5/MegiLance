"""
Blockchain Payment Service for USDC Transactions
Handles Web3 wallet integration and smart contract interactions
"""
from typing import Optional, Dict, Any
from decimal import Decimal
import os
import json

# Graceful fallback for missing dependencies
try:
    from web3 import Web3
    from eth_account import Account
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False
    print("[WARNING] Web3 not installed - Blockchain features will use mock implementation")
    # Mock classes for type hinting/runtime safety
    class Web3:
        def to_checksum_address(self, addr): return addr
        class HTTPProvider: 
            def __init__(self, url): pass
    class Account:
        @staticmethod
        def from_key(key): return None

class BlockchainPaymentService:
    """Service for handling blockchain-based USDC payments"""
    
    def __init__(self):
        self.rpc_url = os.getenv('POLYGON_RPC_URL', 'https://polygon-rpc.com/')
        
        if WEB3_AVAILABLE:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            # USDC Contract Address on Polygon
            self.usdc_address = os.getenv('USDC_CONTRACT_ADDRESS', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174')
            # Load USDC ABI (standard ERC20)
            self.usdc_abi = self._load_usdc_abi()
            try:
                self.usdc_contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.usdc_address),
                    abi=self.usdc_abi
                )
            except Exception:
                self.usdc_contract = None
        else:
            self.w3 = None
            self.usdc_contract = None
            self.usdc_address = '0xMOCK_USDC_ADDRESS'
        
        # Escrow contract address (to be deployed)
        self.escrow_address = os.getenv('ESCROW_CONTRACT_ADDRESS', '')
    
    def _load_usdc_abi(self) -> list:
        """Load USDC ERC20 contract ABI"""
        return [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": False,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": False,
                "inputs": [
                    {"name": "_from", "type": "address"},
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transferFrom",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": False,
                "inputs": [
                    {"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            }
        ]
    
    async def check_balance(self, wallet_address: str) -> Decimal:
        """Check USDC balance for a wallet address"""
        if not WEB3_AVAILABLE or not self.usdc_contract:
            return Decimal("1000.00") # Mock balance
            
        try:
            balance_wei = self.usdc_contract.functions.balanceOf(
                Web3.to_checksum_address(wallet_address)
            ).call()
            # USDC has 6 decimals
            balance_usdc = Decimal(balance_wei) / Decimal(10 ** 6)
            return balance_usdc
        except Exception as e:
            print(f"[BLOCKCHAIN] Error checking balance: {e}")
            return Decimal(0)
    
    async def initiate_payment(
        self,
        from_address: str,
        to_address: str,
        amount_usdc: Decimal,
        private_key: str
    ) -> Dict[str, Any]:
        """
        Initiate USDC payment transaction
        Returns transaction hash and status
        """
        if not WEB3_AVAILABLE:
            return {
                'success': True,
                'transaction_hash': '0xMOCK_TRANSACTION_HASH_' + os.urandom(4).hex(),
                'status': 'pending',
                'amount': str(amount_usdc),
                'from': from_address,
                'to': to_address,
                'mock': True
            }

        try:
            # Convert USDC amount to wei (6 decimals)
            amount_wei = int(amount_usdc * Decimal(10 ** 6))
            
            # Get account from private key
            account = Account.from_key(private_key)
            
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(account.address)
            
            transaction = self.usdc_contract.functions.transfer(
                Web3.to_checksum_address(to_address),
                amount_wei
            ).build_transaction({
                'chainId': 137,  # Polygon mainnet
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return {
                'success': True,
                'transaction_hash': tx_hash.hex(),
                'status': 'pending',
                'amount': str(amount_usdc),
                'from': from_address,
                'to': to_address
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'status': 'failed'
            }
    
    async def verify_transaction(self, tx_hash: str) -> Dict[str, Any]:
        """Verify transaction status on blockchain"""
        if not WEB3_AVAILABLE:
            return {
                'confirmed': True,
                'status': 'success',
                'block_number': 12345678,
                'gas_used': 21000,
                'transaction_hash': tx_hash,
                'mock': True
            }

        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            if receipt:
                return {
                    'confirmed': True,
                    'status': 'success' if receipt['status'] == 1 else 'failed',
                    'block_number': receipt['blockNumber'],
                    'gas_used': receipt['gasUsed'],
                    'transaction_hash': tx_hash
                }
            else:
                return {
                    'confirmed': False,
                    'status': 'pending',
                    'transaction_hash': tx_hash
                }
        except Exception as e:
            return {
                'confirmed': False,
                'status': 'unknown',
                'error': str(e)
            }
    
    async def create_escrow(
        self,
        client_address: str,
        freelancer_address: str,
        amount_usdc: Decimal,
        milestones: list
    ) -> Dict[str, Any]:
        """
        Create escrow smart contract for project
        TODO: Deploy actual escrow contract
        """
        # Placeholder for escrow creation
        return {
            'escrow_address': '0x0000000000000000000000000000000000000000',
            'client': client_address,
            'freelancer': freelancer_address,
            'amount': str(amount_usdc),
            'milestones': len(milestones),
            'status': 'created',
            'message': 'Escrow feature coming soon - direct payments currently supported'
        }

# Singleton instance
blockchain_service = BlockchainPaymentService()
