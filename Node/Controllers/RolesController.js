import RolesServices from "../Services/RolesServices.js";

export const getAllRoles = async (req, res) => {
    try {
        const roles = await RolesServices.getAll();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRoles = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "ID inválido" });
        }

        const role = await RolesServices.getById(id);
        res.status(200).json(role);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createRoles = async (req, res) => {
    try {
        const role = await RolesServices.create(req.body);
        res.status(201).json({
            message: "Rol creado correctamente",
            role
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateRoles = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "ID inválido" });
        }

        await RolesServices.update(id, req.body);

        res.status(200).json({
            message: "Rol actualizado correctamente"
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteRoles = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "ID inválido" });
        }

        await RolesServices.delete(id);

        res.status(204).send();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};