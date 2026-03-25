/**
 * Soft Delete Plugin
 *
 * Privacy Act Compliance: Australian privacy law requires 7-year data retention
 * Never hard delete - always use soft delete with deletedAt timestamp
 *
 * Adds:
 * - deletedAt field
 * - isDeleted virtual
 * - softDelete() method
 * - restore() method
 * - findActive() static method
 */

module.exports = function softDeletePlugin(schema) {
  // Add deletedAt field
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  });

  // Add virtual for checking if deleted
  schema.virtual('isDeleted').get(function () {
    return this.deletedAt !== null;
  });

  // Instance method to soft delete
  schema.methods.softDelete = async function () {
    this.deletedAt = new Date();
    return await this.save();
  };

  // Instance method to restore
  schema.methods.restore = async function () {
    this.deletedAt = null;
    return await this.save();
  };

  // Static method to find only active (non-deleted) documents
  schema.statics.findActive = function (conditions = {}) {
    return this.find({ ...conditions, deletedAt: null });
  };

  // Static method to find including deleted
  schema.statics.findWithDeleted = function (conditions = {}) {
    // Explicitly include all records regardless of deletedAt
    // This will be excluded from the middleware filter
    return this.find({ ...conditions, deletedAt: { $exists: true } }).setOptions({ _bypassSoftDelete: true });
  };

  // Use query middleware to exclude deleted by default
  // This applies to find, findOne, findOneAndUpdate, etc.
  async function excludeDeleted() {
    // Skip if this is a findWithDeleted query
    if (this.getOptions()._bypassSoftDelete) {
      return;
    }

    // Only apply filter if deletedAt hasn't been explicitly set
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('count', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);
};
