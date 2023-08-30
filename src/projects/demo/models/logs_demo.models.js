
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("logs_demo", {
		device_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'devices',
				key: 'id'
			}
		}
	},
	{
		tableName: 'logs_demo',
		freezeTableName: true
	})
}

