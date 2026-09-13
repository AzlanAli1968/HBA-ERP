import hotels from './hotels'
import vehicles from './vehicles'
import transferLocations from './transfer-locations'
const options = {
    hotels: Object.assign(hotels, hotels),
vehicles: Object.assign(vehicles, vehicles),
transferLocations: Object.assign(transferLocations, transferLocations),
}

export default options