
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("modelPermissions", {
		client_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'clients',
				key: 'id'
			}
		},
		model_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'models',
				key: 'id'
			}
		},
		level: {
			type: DataTypes.INTEGER,
		}
	},
	{
		tableName: 'modelPermissions',
		freezeTableName: true
	})
}
