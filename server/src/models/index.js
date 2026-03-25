/**
 * Models Index
 *
 * Central export point for all Mongoose models
 */

const User = require('./User');
const Company = require('./Company');
const Client = require('./Client');
const Employee = require('./Employee');
const Shift = require('./Shift');
const Site = require('./Site');
const AccessCode = require('./AccessCode');
const EmployeeSite = require('./EmployeeSite');

module.exports = {
  User,
  Company,
  Client,
  Employee,
  Shift,
  Site,
  AccessCode,
  EmployeeSite,
};
