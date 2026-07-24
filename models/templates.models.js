
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("templates", {
		tag: {
			type: DataTypes.STRING,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		client_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		project_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
	},
	{
		tableName: 'templates',
		freezeTableName: true
	})
}
