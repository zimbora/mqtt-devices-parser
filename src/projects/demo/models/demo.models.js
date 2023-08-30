
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("demos", {
		device_id: {
			type: DataTypes.INTEGER,
			unique: true,
			references: {
				model: 'devices',
				key: 'id'
			}
		},
	},
	{
		tableName: 'demos',
		freezeTableName: true
	})
}

