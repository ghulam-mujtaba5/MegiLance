# @AI-HINT: Multi-currency support service with exchange rates and conversions
"""
Multi-Currency Service

Handles currency conversion, exchange rates, user currency preferences,
and international payment support.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
import logging

from app.models.user import User

logger = logging.getLogger(__name__)


class Currency(str, Enum):
    USD = "USD"  # US Dollar
    EUR = "EUR"  # Euro
    GBP = "GBP"  # British Pound
    CAD = "CAD"  # Canadian Dollar
    AUD = "AUD"  # Australian Dollar
    JPY = "JPY"  # Japanese Yen
    CNY = "CNY"  # Chinese Yuan
    INR = "INR"  # Indian Rupee
    BRL = "BRL"  # Brazilian Real
    MXN = "MXN"  # Mexican Peso
    CHF = "CHF"  # Swiss Franc
    SGD = "SGD"  # Singapore Dollar
    HKD = "HKD"  # Hong Kong Dollar
    KRW = "KRW"  # South Korean Won
    SEK = "SEK"  # Swedish Krona
    NOK = "NOK"  # Norwegian Krone
    DKK = "DKK"  # Danish Krone
    NZD = "NZD"  # New Zealand Dollar
    ZAR = "ZAR"  # South African Rand
    PKR = "PKR"  # Pakistani Rupee
    AED = "AED"  # UAE Dirham
    PLN = "PLN"  # Polish Zloty
    THB = "THB"  # Thai Baht
    PHP = "PHP"  # Philippine Peso
    IDR = "IDR"  # Indonesian Rupiah


# Currency metadata
CURRENCY_INFO = {
    Currency.USD: {"name": "US Dollar", "symbol": "$", "decimals": 2, "locale": "en-US"},
    Currency.EUR: {"name": "Euro", "symbol": "€", "decimals": 2, "locale": "de-DE"},
    Currency.GBP: {"name": "British Pound", "symbol": "£", "decimals": 2, "locale": "en-GB"},
    Currency.CAD: {"name": "Canadian Dollar", "symbol": "C$", "decimals": 2, "locale": "en-CA"},
    Currency.AUD: {"name": "Australian Dollar", "symbol": "A$", "decimals": 2, "locale": "en-AU"},
    Currency.JPY: {"name": "Japanese Yen", "symbol": "¥", "decimals": 0, "locale": "ja-JP"},
    Currency.CNY: {"name": "Chinese Yuan", "symbol": "¥", "decimals": 2, "locale": "zh-CN"},
    Currency.INR: {"name": "Indian Rupee", "symbol": "₹", "decimals": 2, "locale": "hi-IN"},
    Currency.BRL: {"name": "Brazilian Real", "symbol": "R$", "decimals": 2, "locale": "pt-BR"},
    Currency.MXN: {"name": "Mexican Peso", "symbol": "MX$", "decimals": 2, "locale": "es-MX"},
    Currency.CHF: {"name": "Swiss Franc", "symbol": "CHF", "decimals": 2, "locale": "de-CH"},
    Currency.SGD: {"name": "Singapore Dollar", "symbol": "S$", "decimals": 2, "locale": "en-SG"},
    Currency.HKD: {"name": "Hong Kong Dollar", "symbol": "HK$", "decimals": 2, "locale": "zh-HK"},
    Currency.KRW: {"name": "South Korean Won", "symbol": "₩", "decimals": 0, "locale": "ko-KR"},
    Currency.SEK: {"name": "Swedish Krona", "symbol": "kr", "decimals": 2, "locale": "sv-SE"},
    Currency.NOK: {"name": "Norwegian Krone", "symbol": "kr", "decimals": 2, "locale": "nb-NO"},
    Currency.DKK: {"name": "Danish Krone", "symbol": "kr", "decimals": 2, "locale": "da-DK"},
    Currency.NZD: {"name": "New Zealand Dollar", "symbol": "NZ$", "decimals": 2, "locale": "en-NZ"},
    Currency.ZAR: {"name": "South African Rand", "symbol": "R", "decimals": 2, "locale": "en-ZA"},
    Currency.PKR: {"name": "Pakistani Rupee", "symbol": "Rs", "decimals": 2, "locale": "ur-PK"},
    Currency.AED: {"name": "UAE Dirham", "symbol": "د.إ", "decimals": 2, "locale": "ar-AE"},
    Currency.PLN: {"name": "Polish Zloty", "symbol": "zł", "decimals": 2, "locale": "pl-PL"},
    Currency.THB: {"name": "Thai Baht", "symbol": "฿", "decimals": 2, "locale": "th-TH"},
    Currency.PHP: {"name": "Philippine Peso", "symbol": "₱", "decimals": 2, "locale": "en-PH"},
    Currency.IDR: {"name": "Indonesian Rupiah", "symbol": "Rp", "decimals": 0, "locale": "id-ID"},
}

# Static exchange rates (USD base) - In production, fetch from API
EXCHANGE_RATES = {
    Currency.USD: Decimal("1.0000"),
    Currency.EUR: Decimal("0.9200"),
    Currency.GBP: Decimal("0.7900"),
    Currency.CAD: Decimal("1.3600"),
    Currency.AUD: Decimal("1.5300"),
    Currency.JPY: Decimal("149.5000"),
    Currency.CNY: Decimal("7.2500"),
    Currency.INR: Decimal("83.1000"),
    Currency.BRL: Decimal("4.9700"),
    Currency.MXN: Decimal("17.1500"),
    Currency.CHF: Decimal("0.8800"),
    Currency.SGD: Decimal("1.3400"),
    Currency.HKD: Decimal("7.8100"),
    Currency.KRW: Decimal("1320.0000"),
    Currency.SEK: Decimal("10.4500"),
    Currency.NOK: Decimal("10.6000"),
    Currency.DKK: Decimal("6.8500"),
    Currency.NZD: Decimal("1.6400"),
    Currency.ZAR: Decimal("18.7500"),
    Currency.PKR: Decimal("278.0000"),
    Currency.AED: Decimal("3.6700"),
    Currency.PLN: Decimal("3.9800"),
    Currency.THB: Decimal("35.5000"),
    Currency.PHP: Decimal("55.8000"),
    Currency.IDR: Decimal("15600.0000"),
}


class MultiCurrencyService:
    """Service for multi-currency support"""
    
    def __init__(self, db: Session):
        self.db = db
        self._rates_last_updated = datetime.now(timezone.utc)
    
    # Currency Information
    async def get_supported_currencies(self) -> List[Dict[str, Any]]:
        """Get list of all supported currencies"""
        currencies = []
        for currency in Currency:
            info = CURRENCY_INFO.get(currency, {})
            rate = EXCHANGE_RATES.get(currency, Decimal("1"))
            currencies.append({
                "code": currency.value,
                "name": info.get("name", currency.value),
                "symbol": info.get("symbol", currency.value),
                "decimals": info.get("decimals", 2),
                "locale": info.get("locale"),
                "exchange_rate_usd": float(rate)
            })
        return currencies
    
    async def get_currency_info(self, currency: Currency) -> Dict[str, Any]:
        """Get detailed information about a currency"""
        if currency not in CURRENCY_INFO:
            return {"error": "Currency not supported"}
        
        info = CURRENCY_INFO[currency]
        return {
            "code": currency.value,
            "name": info["name"],
            "symbol": info["symbol"],
            "decimals": info["decimals"],
            "locale": info["locale"],
            "exchange_rate_usd": float(EXCHANGE_RATES.get(currency, Decimal("1")))
        }
    
    # Exchange Rates
    async def get_exchange_rates(
        self,
        base_currency: Currency = Currency.USD
    ) -> Dict[str, Any]:
        """Get current exchange rates"""
        base_rate = EXCHANGE_RATES.get(base_currency, Decimal("1"))
        
        rates = {}
        for currency in Currency:
            target_rate = EXCHANGE_RATES.get(currency, Decimal("1"))
            # Convert: base -> USD -> target
            rate = target_rate / base_rate
            rates[currency.value] = float(rate.quantize(Decimal("0.0001")))
        
        return {
            "base": base_currency.value,
            "rates": rates,
            "updated_at": self._rates_last_updated.isoformat()
        }
    
    async def get_exchange_rate(
        self,
        from_currency: Currency,
        to_currency: Currency
    ) -> Dict[str, Any]:
        """Get exchange rate between two currencies"""
        from_rate = EXCHANGE_RATES.get(from_currency, Decimal("1"))
        to_rate = EXCHANGE_RATES.get(to_currency, Decimal("1"))
        
        rate = to_rate / from_rate
        
        return {
            "from": from_currency.value,
            "to": to_currency.value,
            "rate": float(rate.quantize(Decimal("0.0001"))),
            "inverse_rate": float((Decimal("1") / rate).quantize(Decimal("0.0001"))),
            "updated_at": self._rates_last_updated.isoformat()
        }
    
    # Currency Conversion
    async def convert(
        self,
        amount: Decimal,
        from_currency: Currency,
        to_currency: Currency,
        include_fee: bool = False,
        fee_percentage: Decimal = Decimal("2.5")
    ) -> Dict[str, Any]:
        """Convert amount between currencies"""
        if from_currency == to_currency:
            return {
                "original_amount": float(amount),
                "converted_amount": float(amount),
                "from_currency": from_currency.value,
                "to_currency": to_currency.value,
                "rate": 1.0,
                "fee": 0.0,
                "final_amount": float(amount)
            }
        
        from_rate = EXCHANGE_RATES.get(from_currency, Decimal("1"))
        to_rate = EXCHANGE_RATES.get(to_currency, Decimal("1"))
        
        # Convert to USD first, then to target
        usd_amount = amount / from_rate
        converted_amount = usd_amount * to_rate
        
        # Apply decimals for target currency
        decimals = CURRENCY_INFO.get(to_currency, {}).get("decimals", 2)
        quantize_str = "0." + "0" * decimals if decimals > 0 else "1"
        converted_amount = converted_amount.quantize(Decimal(quantize_str), ROUND_HALF_UP)
        
        fee = Decimal("0")
        if include_fee:
            fee = (converted_amount * fee_percentage / 100).quantize(Decimal(quantize_str), ROUND_HALF_UP)
        
        final_amount = converted_amount - fee
        
        return {
            "original_amount": float(amount),
            "converted_amount": float(converted_amount),
            "from_currency": from_currency.value,
            "to_currency": to_currency.value,
            "rate": float((to_rate / from_rate).quantize(Decimal("0.0001"))),
            "fee": float(fee),
            "fee_percentage": float(fee_percentage) if include_fee else 0.0,
            "final_amount": float(final_amount),
            "converted_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def bulk_convert(
        self,
        amount: Decimal,
        from_currency: Currency,
        to_currencies: List[Currency]
    ) -> Dict[str, Any]:
        """Convert amount to multiple currencies at once"""
        conversions = {}
        for to_currency in to_currencies:
            result = await self.convert(amount, from_currency, to_currency)
            conversions[to_currency.value] = {
                "amount": result["converted_amount"],
                "rate": result["rate"]
            }
        
        return {
            "original_amount": float(amount),
            "from_currency": from_currency.value,
            "conversions": conversions,
            "converted_at": datetime.now(timezone.utc).isoformat()
        }
    
    # User Currency Preferences
    async def get_user_currency(self, user_id: int) -> Dict[str, Any]:
        """Get user's preferred currency"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        profile_data = user.profile_data or {}
        currency_code = profile_data.get("preferred_currency", "USD")
        
        try:
            currency = Currency(currency_code)
        except ValueError:
            currency = Currency.USD
        
        return {
            "user_id": user_id,
            "currency": currency.value,
            "currency_info": await self.get_currency_info(currency)
        }
    
    async def set_user_currency(
        self,
        user_id: int,
        currency: Currency
    ) -> Dict[str, Any]:
        """Set user's preferred currency"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"error": "User not found"}
            
            profile_data = user.profile_data or {}
            profile_data["preferred_currency"] = currency.value
            user.profile_data = profile_data
            self.db.commit()
            
            return {
                "message": "Currency preference updated",
                "user_id": user_id,
                "currency": currency.value
            }
            
        except Exception as e:
            logger.error(f"Error setting user currency: {e}")
            self.db.rollback()
            return {"error": str(e)}
    
    # Formatting
    async def format_amount(
        self,
        amount: Decimal,
        currency: Currency,
        include_symbol: bool = True
    ) -> str:
        """Format amount for display"""
        info = CURRENCY_INFO.get(currency, {})
        decimals = info.get("decimals", 2)
        symbol = info.get("symbol", currency.value)
        
        quantize_str = "0." + "0" * decimals if decimals > 0 else "1"
        formatted_amount = amount.quantize(Decimal(quantize_str), ROUND_HALF_UP)
        
        # Format with thousand separators
        if decimals > 0:
            amount_str = f"{formatted_amount:,.{decimals}f}"
        else:
            amount_str = f"{formatted_amount:,.0f}"
        
        if include_symbol:
            return f"{symbol}{amount_str}"
        return amount_str
    
    async def parse_amount(
        self,
        amount_str: str,
        currency: Currency
    ) -> Decimal:
        """Parse formatted amount string to Decimal"""
        # Remove currency symbols and thousand separators
        info = CURRENCY_INFO.get(currency, {})
        symbol = info.get("symbol", "")
        
        cleaned = amount_str.replace(symbol, "").replace(",", "").strip()
        return Decimal(cleaned)
    
    # Price Display
    async def get_price_display(
        self,
        amount_usd: Decimal,
        user_id: int
    ) -> Dict[str, Any]:
        """Get price in user's preferred currency"""
        user_currency = await self.get_user_currency(user_id)
        if "error" in user_currency:
            return user_currency
        
        currency = Currency(user_currency["currency"])
        converted = await self.convert(amount_usd, Currency.USD, currency)
        
        return {
            "original_usd": float(amount_usd),
            "display_amount": converted["converted_amount"],
            "display_currency": currency.value,
            "formatted": await self.format_amount(
                Decimal(str(converted["converted_amount"])),
                currency
            ),
            "rate": converted["rate"]
        }
    
    # Rate History (placeholder)
    async def get_rate_history(
        self,
        from_currency: Currency,
        to_currency: Currency,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get historical exchange rates"""
        # Placeholder - would fetch from rate history storage
        return {
            "from_currency": from_currency.value,
            "to_currency": to_currency.value,
            "period_days": days,
            "history": [],
            "message": "Rate history not yet implemented"
        }
    
    # Rate Alerts (placeholder)
    async def create_rate_alert(
        self,
        user_id: int,
        from_currency: Currency,
        to_currency: Currency,
        target_rate: Decimal,
        alert_type: str = "above"  # above, below
    ) -> Dict[str, Any]:
        """Create an exchange rate alert"""
        # Placeholder
        return {
            "alert_id": f"alert_{user_id}_{from_currency.value}_{to_currency.value}",
            "user_id": user_id,
            "from_currency": from_currency.value,
            "to_currency": to_currency.value,
            "target_rate": float(target_rate),
            "alert_type": alert_type,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "message": "Rate alerts not yet implemented"
        }


def get_multi_currency_service(db: Session) -> MultiCurrencyService:
    """Get multi-currency service instance"""
    return MultiCurrencyService(db)
