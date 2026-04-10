import { DataTypes } from "sequelize";
import { sequelizeDb } from "../config/database.js";

const User = sequelizeDb.define(
	"User",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		role_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},

		organization_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		department_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		district_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		printer_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		delivery_point_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0,
		},
		godown_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0,
		},
		designation_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		profile_image: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		username: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
		},
		password: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		force_password_reset: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		mobile: {
			type: DataTypes.STRING(15),
			allowNull: true,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		created_by: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		created_on: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		created_ip: {
			type: DataTypes.STRING(45),
			allowNull: true,
		},
		updated_by: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		updated_on: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: DataTypes.NOW,
		},
		updated_ip: {
			type: DataTypes.STRING(45),
			allowNull: true,
		},
	},
	{
		tableName: "users",
		timestamps: false,
	},
);

export default User;
