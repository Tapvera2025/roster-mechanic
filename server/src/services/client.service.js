/**
 * Clients Service
 *
 * Business logic for client/customer management with multi-tenant isolation
 */

const Client = require('../models/Client');
const mongoose = require('mongoose');

class ClientsService {
  /**
   * Get all clients with filters and pagination
   * @param {Object} context - { companyId, userId, role }
   * @param {Object} filters - { status, state, search, page, limit, sortBy, order }
   * @returns {Promise<Object>} - { clients, pagination }
   */
  async getAllClients(context, filters = {}) {
    const { companyId } = context;
    const {
      status,
      state,
      search,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      order = 'desc',
    } = filters;

    // Build query with multi-tenant filter
    const query = { companyId };

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (state) {
      query.state = state;
    }

    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { invoicingCompany: { $regex: search, $options: 'i' } },
        { invoiceSubject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Client.countDocuments(query),
    ]);

    return {
      clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single client by ID
   * @param {Object} context - { companyId }
   * @param {String} clientId
   * @returns {Promise<Object>} - Client document
   */
  async getClientById(context, clientId) {
    const { companyId } = context;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      const error = new Error('Invalid client ID');
      error.statusCode = 400;
      throw error;
    }

    const client = await Client.findOne({
      _id: clientId,
      companyId,
    }).lean();

    if (!client) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      throw error;
    }

    return client;
  }

  /**
   * Create a new client
   * @param {Object} context - { companyId, userId }
   * @param {Object} data - Client data
   * @returns {Promise<Object>} - Created client
   */
  async createClient(context, data) {
    const { companyId, userId } = context;

    // Ensure companyId is present
    if (!companyId) {
      const error = new Error('Company ID is required');
      error.statusCode = 400;
      throw error;
    }

    // Check for duplicate clientName within company
    if (data.clientName) {
      const existingClient = await Client.findOne({
        clientName: data.clientName,
        companyId,
      });

      if (existingClient) {
        const error = new Error('Client with this name already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Create client with context
    const client = await Client.create({
      ...data,
      companyId,
      createdBy: userId,
    });

    return client.toObject();
  }

  /**
   * Bulk create clients
   * @param {Object} context - { companyId, userId }
   * @param {Array} clients - Array of client data
   * @returns {Promise<Object>} - { created, failed, errors }
   */
  async bulkCreateClients(context, clients) {
    const { companyId, userId } = context;

    if (!Array.isArray(clients) || clients.length === 0) {
      const error = new Error('Clients array is required');
      error.statusCode = 400;
      throw error;
    }

    const results = {
      created: [],
      failed: [],
      errors: [],
    };

    // Use session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const clientData of clients) {
        try {
          // Check for duplicate clientName
          if (clientData.clientName) {
            const existing = await Client.findOne({
              clientName: clientData.clientName,
              companyId,
            }).session(session);

            if (existing) {
              results.failed.push(clientData);
              results.errors.push({
                client: clientData.clientName,
                error: 'Duplicate client name',
              });
              continue;
            }
          }

          // Create client
          const client = await Client.create(
            [
              {
                ...clientData,
                companyId,
                createdBy: userId,
              },
            ],
            { session }
          );

          results.created.push(client[0].toObject());
        } catch (err) {
          results.failed.push(clientData);
          results.errors.push({
            client: clientData.clientName || 'unknown',
            error: err.message,
          });
        }
      }

      // If all failed, abort transaction
      if (results.created.length === 0) {
        await session.abortTransaction();
        const error = new Error('Failed to create any clients');
        error.statusCode = 400;
        error.details = results.errors;
        throw error;
      }

      await session.commitTransaction();
      return results;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update a client
   * @param {Object} context - { companyId, userId }
   * @param {String} clientId
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated client
   */
  async updateClient(context, clientId, data) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      const error = new Error('Invalid client ID');
      error.statusCode = 400;
      throw error;
    }

    // Find client and verify ownership
    const client = await Client.findOne({
      _id: clientId,
      companyId,
    });

    if (!client) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      throw error;
    }

    // Check for duplicate clientName (excluding current client)
    if (data.clientName && data.clientName !== client.clientName) {
      const existingClient = await Client.findOne({
        clientName: data.clientName,
        companyId,
        _id: { $ne: clientId },
      });

      if (existingClient) {
        const error = new Error('Client with this name already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Don't allow updating companyId
    delete data.companyId;

    // Update client
    Object.assign(client, data);
    client.updatedBy = userId;

    await client.save();

    return client.toObject();
  }

  /**
   * Delete a client (soft delete)
   * @param {Object} context - { companyId, userId }
   * @param {String} clientId
   * @returns {Promise<Object>} - Success message
   */
  async deleteClient(context, clientId) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      const error = new Error('Invalid client ID');
      error.statusCode = 400;
      throw error;
    }

    const client = await Client.findOne({
      _id: clientId,
      companyId,
    });

    if (!client) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      throw error;
    }

    // Set deletedBy before soft delete
    client.deletedBy = userId;

    // Soft delete if plugin is available
    if (typeof client.softDelete === 'function') {
      await client.softDelete();
    } else {
      client.deletedAt = new Date();
      await client.save();
    }

    return { success: true, message: 'Client deleted successfully' };
  }
}

module.exports = new ClientsService();
