import receipts from './receipts'
import journalVouchers from './journal-vouchers'
import ledger from './ledger'
import clearance from './clearance'
import payments from './payments'
import vouchers from './vouchers'
import cashBankBalances from './cash-bank-balances'
import balances from './balances'
const accounting = {
    receipts: Object.assign(receipts, receipts),
journalVouchers: Object.assign(journalVouchers, journalVouchers),
ledger: Object.assign(ledger, ledger),
clearance: Object.assign(clearance, clearance),
payments: Object.assign(payments, payments),
vouchers: Object.assign(vouchers, vouchers),
cashBankBalances: Object.assign(cashBankBalances, cashBankBalances),
balances: Object.assign(balances, balances),
}

export default accounting