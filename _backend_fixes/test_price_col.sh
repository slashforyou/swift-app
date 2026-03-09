mysql -u swiftapp_user -pU%Xgxvc54EKUD39PcwNAYvuS swiftapp -S /run/mysql/mysql.sock -e "UPDATE jobs SET counter_proposed_price = NULL WHERE assignment_status='negotiating';"
echo "Note: this is just to verify the column exists and is writable"
