// Super-administrateurs : droits absolus, non supprimables, non rétrogradables
const SUPER_ADMIN_EMAILS = [
    'dialloyero12@gmail.com',
    'sowdjebril@gmail.com',
    'aliouball.academia@gmail.com',
    'oussmanhabsaba@gmail.com',
    'ousmanhabsaba@gmail.com'
]

function isSuperAdmin(email) {
    return SUPER_ADMIN_EMAILS.includes(email?.toLowerCase())
}

module.exports = { SUPER_ADMIN_EMAILS, isSuperAdmin }