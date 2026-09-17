import AdminUsersController from './AdminUsersController'
import AdminRolesController from './AdminRolesController'
const Admin = {
    AdminUsersController: Object.assign(AdminUsersController, AdminUsersController),
AdminRolesController: Object.assign(AdminRolesController, AdminRolesController),
}

export default Admin