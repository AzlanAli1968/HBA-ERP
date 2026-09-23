import hotels from './hotels'
import visaTypes from './visa-types'
import vehicles from './vehicles'
import transferLocations from './transfer-locations'
const options = {
    hotels: Object.assign(hotels, hotels),
visaTypes: Object.assign(visaTypes, visaTypes),
vehicles: Object.assign(vehicles, vehicles),
transferLocations: Object.assign(transferLocations, transferLocations),
}

export default options