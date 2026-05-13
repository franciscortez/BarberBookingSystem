const {
    getAllBarber,
    getBarberById,
    createBarber,
    updateBarber,
    deleteBarber
} = require('../model/Barber');

const getBarbers = async (req, res) => {
    try {
        const barbers = await getAllBarber();
        res.status(200).json(barbers);
    } catch (error) {
        console.error('Error fetching barbers:', error);
        res.status(500).json({ error: 'Failed to fetch barbers' });
    }
};

const getBarber = async (req, res) => {
    try {
        const { id } = req.params;
        const barber = await getBarberById(id);
        if (!barber) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        res.status(200).json(barber);
    } catch (error) {
        console.error('Error fetching barber:', error);
        res.status(500).json({ error: 'Failed to fetch barber' });
    }
};

const addBarber = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const newBarber = await createBarber(name);
        res.status(201).json(newBarber);
    } catch (error) {
        console.error('Error creating barber:', error);
        res.status(500).json({ error: 'Failed to create barber' });
    }
};

const editBarber = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const updatedBarber = await updateBarber(id, name);
        if (!updatedBarber) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        res.status(200).json(updatedBarber);
    } catch (error) {
        console.error('Error updating barber:', error);
        res.status(500).json({ error: 'Failed to update barber' });
    }
};

const removeBarber = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await deleteBarber(id);
        if (!success) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        res.status(200).json({ message: 'Barber deleted successfully' });
    } catch (error) {
        console.error('Error deleting barber:', error);
        res.status(500).json({ error: 'Failed to delete barber' });
    }
};

module.exports = {
    getBarbers,
    getBarber,
    addBarber,
    editBarber,
    removeBarber
};
