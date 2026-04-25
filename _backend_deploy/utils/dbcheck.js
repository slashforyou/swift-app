process.env.DB_HOST="localhost";
process.env.DB_USER="swiftapp_user";
process.env.DB_PASS="U%Xgxvc54EKUD39PcwNAYvuS";
process.env.DB_DATABASE="swiftapp";
process.env.DB_PORT="3306";
process.env.DB_SOCKET="/run/mysql/mysql.sock";
const db=require("/srv/www/htdocs/swiftapp/server/swiftDb");
(async()=>{
const c=await db.connect();
const[r]=await c.query("SELECT id,company_id,stripe_account_id,charges_enabled,payouts_enabled,details_submitted,disconnected_at FROM stripe_connected_accounts WHERE company_id=12");
console.log(JSON.stringify(r,null,2));
await c.end();
process.exit(0);
})();
