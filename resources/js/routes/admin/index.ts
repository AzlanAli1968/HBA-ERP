import users from './users'
import roles from './roles'
import settings from './settings'
const admin = {
    users: Object.assign(users, users),
roles: Object.assign(roles, roles),
settings: Object.assign(settings, settings),
}

export default admin