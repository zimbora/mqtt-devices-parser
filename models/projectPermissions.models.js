
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("projectPermissions", {
		client_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'clients',
				key: 'id'
			}
		},
		project_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'projects',
				key: 'id'
			}
		},
		level: {
			type: DataTypes.INTEGER,
		}
	},
	{
		tableName: 'projectPermissions',
		freezeTableName: true
	})
}
