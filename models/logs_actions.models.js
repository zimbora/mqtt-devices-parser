
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("logs_actions", {
		client_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		action: {
			type: DataTypes.STRING,
			allowNull: true
		},
	},
	{
		tableName: 'logs_actions',
		freezeTableName: true
	})
}
