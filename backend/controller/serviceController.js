const Service = require('../model/Service');

/**
 * Get all services or services by barberId
 * @route GET /api/services
 * @route GET /api/services?barberId=UUID
 */
const getServices = async (req, res) => {
    try {
        const { barberId } = req.query;
        let services;

        if (barberId) {
            services = await Service.getServicesByBarber(barberId);
        } else {
            services = await Service.getAllServices();
        }

        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while fetching services' });
    }
};

/**
 * Get a single service by ID
 * @route GET /api/services/:id
 */
const getService = async (req, res) => {
    try {
        const service = await Service.getServiceById(req.params.id);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while fetching service' });
    }
};

/**
 * Add a new service (Admin only)
 * @route POST /api/services
 */
const addService = async (req, res) => {
    try {
        const { barber_id, name, total_price, downpayment_amount, duration_mins } = req.body;

        if (!barber_id || !name || !total_price || !downpayment_amount || !duration_mins) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        const newService = await Service.createService(req.body);
        res.status(201).json(newService);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while adding service' });
    }
};

/**
 * Edit an existing service (Admin only)
 * @route PUT /api/services/:id
 */
const editService = async (req, res) => {
    try {
        const updatedService = await Service.updateService(req.params.id, req.body);
        if (!updatedService) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(updatedService);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while updating service' });
    }
};

/**
 * Remove a service (Admin only)
 * @route DELETE /api/services/:id
 */
const removeService = async (req, res) => {
    try {
        const success = await Service.deleteService(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({ message: 'Service removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while removing service' });
    }
};

module.exports = {
    getServices,
    getService,
    addService,
    editService,
    removeService
};
