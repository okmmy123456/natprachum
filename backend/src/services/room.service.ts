import { Op } from 'sequelize';
import { MeetingRoom, RoomImage, Equipment, RoomEquipment, User, RoomOwner } from '../models';
import { getPagination, getSorting } from '../utils/pagination';
import { generateQRCode } from './qrcode.service';
import { logAudit } from './auditlog.service';

export class RoomService {
  static async getAll(query: any) {
    const { page, limit, offset } = getPagination(query);
    const { sortBy, sortOrder } = getSorting(query, ['created_at', 'room_name', 'capacity']);

    const where: any = { is_active: true };
    if (query.search) {
      where[Op.or] = [
        { room_name: { [Op.like]: `%${query.search}%` } },
        { location: { [Op.like]: `%${query.search}%` } },
      ];
    }
    if (query.location) where.location = query.location;
    if (query.capacity_min) where.capacity = { ...where.capacity, [Op.gte]: parseInt(query.capacity_min) };
    if (query.capacity_max) where.capacity = { ...where.capacity, [Op.lte]: parseInt(query.capacity_max) };

    const { count, rows } = await MeetingRoom.findAndCountAll({
      where,
      include: [
        { model: RoomImage, as: 'RoomImages', attributes: ['id', 'image_url', 'sort_order'] },
        { model: RoomEquipment, as: 'RoomEquipments', include: [{ model: Equipment, as: 'Equipment' }] },
        { model: User, as: 'Owners', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true,
    });

    return { data: rows, total: count, page, limit };
  }

  static async getById(id: number) {
    const room = await MeetingRoom.findByPk(id, {
      include: [
        { model: RoomImage, as: 'RoomImages', attributes: ['id', 'image_url', 'sort_order'] },
        { model: RoomEquipment, as: 'RoomEquipments', include: [{ model: Equipment, as: 'Equipment' }] },
        { model: User, as: 'Owners', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });
    if (!room) throw { statusCode: 404, message: 'Room not found' };
    return room;
  }

  static async create(data: any, actionBy?: number) {
    const room = await MeetingRoom.create(data);

    // Add Owners
    if (data.owner_ids && Array.isArray(data.owner_ids)) {
      for (const uId of data.owner_ids) {
        await RoomOwner.create({ id: 0, room_id: room.id, user_id: Number(uId) });
      }
    }

    // Generate QR code
    const qrCodeUrl = await generateQRCode(room.id);
    await room.update({ qr_code_url: qrCodeUrl });

    // Add equipment
    if (data.equipment_ids && Array.isArray(data.equipment_ids)) {
      for (const eqId of data.equipment_ids) {
        await RoomEquipment.create({ id: 0, room_id: room.id, equipment_id: eqId, quantity: 1 });
      }
    }

    await logAudit('meeting_rooms', room.id, 'CREATE', null, room.toJSON(), actionBy);
    return await this.getById(room.id);
  }

  static async update(id: number, data: any, actionBy?: number) {
    const room = await MeetingRoom.findByPk(id);
    if (!room) throw { statusCode: 404, message: 'Room not found' };

    const oldData = room.toJSON();
    const { equipment_ids, owner_ids, ...updateData } = data;
    
    await room.update(updateData);

    // Update owners if provided
    if (owner_ids && Array.isArray(owner_ids)) {
      await RoomOwner.destroy({ where: { room_id: id }, force: true });
      for (const uId of owner_ids) {
        await RoomOwner.create({ id: 0, room_id: id, user_id: Number(uId) });
      }
    }

    // Update equipment if provided
    if (equipment_ids && Array.isArray(equipment_ids)) {
      await RoomEquipment.destroy({ where: { room_id: id }, force: true });
      for (const eqId of equipment_ids) {
        await RoomEquipment.create({ id: 0, room_id: id, equipment_id: eqId, quantity: 1 });
      }
    }

    await logAudit('meeting_rooms', id, 'UPDATE', oldData, room.toJSON(), actionBy);
    return await this.getById(id);
  }

  static async delete(id: number, actionBy?: number) {
    const room = await MeetingRoom.findByPk(id);
    if (!room) throw { statusCode: 404, message: 'Room not found' };

    await logAudit('meeting_rooms', id, 'DELETE', room.toJSON(), null, actionBy);
    await room.destroy(); // soft delete
    return { message: 'Room deleted' };
  }

  static async addImages(id: number, imageUrls: string[]) {
    const room = await MeetingRoom.findByPk(id);
    if (!room) throw { statusCode: 404, message: 'Room not found' };

    const existingImages = await RoomImage.findAll({ where: { room_id: id } });
    if (existingImages.length + imageUrls.length > 10) {
      throw { statusCode: 400, message: `Cannot upload more than 10 images. You currently have ${existingImages.length} images.` };
    }

    const maxSortOrder = existingImages.reduce((max, img) => Math.max(max, img.sort_order), -1);

    const images = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const image = await RoomImage.create({ room_id: id, image_url: imageUrls[i], sort_order: maxSortOrder + 1 + i });
      images.push(image);
    }
    return images;
  }

  static async deleteImage(roomId: number, imageId: number) {
    const image = await RoomImage.findOne({ where: { id: imageId, room_id: roomId } });
    if (!image) throw { statusCode: 404, message: 'Image not found' };
    await image.destroy({ force: true });
    return { message: 'Image deleted' };
  }

  static async reorderImages(roomId: number, imageIds: number[]) {
    const room = await MeetingRoom.findByPk(roomId);
    if (!room) throw { statusCode: 404, message: 'Room not found' };

    // Batch update sort_order based on array index
    for (let i = 0; i < imageIds.length; i++) {
      await RoomImage.update(
        { sort_order: i },
        { where: { id: imageIds[i], room_id: roomId } }
      );
    }
    return { message: 'Images reordered successfully' };
  }

  static async getAllEquipments() {
    return Equipment.findAll({ where: { is_active: true }, order: [['equipment_name', 'ASC']] });
  }
}
