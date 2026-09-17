import invoice from './invoice'
import voucher from './voucher'
import ledger from './ledger'
import otherReport from './other-report'
import journalVoucher from './journal-voucher'
const documents = {
    invoice: Object.assign(invoice, invoice),
voucher: Object.assign(voucher, voucher),
ledger: Object.assign(ledger, ledger),
otherReport: Object.assign(otherReport, otherReport),
journalVoucher: Object.assign(journalVoucher, journalVoucher),
}

export default documents