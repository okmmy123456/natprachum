const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', { host: 'localhost', dialect: 'mysql' });
async function run() {
    try {
        const [users] = await sequelize.query("SELECT * FROM Users");
        const u1 = users.find(u => u.username === 'user1');
        const hr = users.find(u => u.username === 'hr02');
        console.log("user1:", { id: u1.id, role_id: u1.role_id });
        console.log("hr02:", { id: hr.id, role_id: hr.role_id });
    } catch (e) { console.error(e) }
    finally { sequelize.close() }
}
run();
