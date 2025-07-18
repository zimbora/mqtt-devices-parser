
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("devices", {
		uid: {
			type: DataTypes.STRING,
			unique: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: true
		},
		status: {
			type: DataTypes.STRING,
			allowNull: true
		},
		project_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'projects',
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
		version: {
			type: DataTypes.STRING,
			allowNull: true
		},
		app_version: {
			type: DataTypes.STRING,
			allowNull: true
		},
		accept_release: {
			type: DataTypes.STRING,
			allowNull: true
		},
		tech: {
			type: DataTypes.STRING,
			allowNull: true
		},
	},
	{
		tableName: 'devices',
		freezeTableName: true
	})
}
