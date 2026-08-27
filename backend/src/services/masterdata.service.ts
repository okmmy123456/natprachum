import { Op } from 'sequelize';
import { Company, Site, Department, Equipment, CompanyHoliday } from '../models';
import { logAudit } from './auditlog.service';

type MasterModel = typeof Company | typeof Site | typeof Department | typeof Equipment;

export class MasterDataService {
  static async getAll(model: MasterModel, query: any = {}) {
    const where: any = {};
    if (query.search) {
      const searchFields = ['company_name', 'site_name', 'department_name', 'equipment_name'];
      where[Op.or] = searchFields
        .filter(f => (model as any).rawAttributes[f])
        .map(f => ({ [f]: { [Op.like]: `%${query.search}%` } }));
    }
    return (model as any).findAll({ where, order: [['id', 'ASC']] });
  }

  static async getById(model: MasterModel, id: number) {
    const record = await (model as any).findByPk(id);
    if (!record) throw { statusCode: 404, message: 'Record not found' };
    return record;
  }

  static async create(model: MasterModel, data: any, actionBy?: number) {
    const record = await (model as any).create(data);
    await logAudit(model.tableName, (record as any).id, 'CREATE', null, (record as any).toJSON(), actionBy);
    return record;
  }

  static async update(model: MasterModel, id: number, data: any, actionBy?: number) {
    const record = await (model as any).findByPk(id);
    if (!record) throw { statusCode: 404, message: 'Record not found' };
    const oldData = (record as any).toJSON();
    await (record as any).update(data);
    await logAudit(model.tableName, id, 'UPDATE', oldData, (record as any).toJSON(), actionBy);
    return record;
  }

  static async delete(model: MasterModel, id: number, actionBy?: number) {
    const record = await (model as any).findByPk(id);
    if (!record) throw { statusCode: 404, message: 'Record not found' };
    await logAudit(model.tableName, id, 'DELETE', (record as any).toJSON(), null, actionBy);
    await (record as any).destroy();
    return { message: 'Record deleted' };
  }
}

export class HolidayService {
  static async getAll(query: any = {}) {
    const where: any = {};
    if (query.year) {
      where.holiday_date = { [Op.between]: [`${query.year}-01-01`, `${query.year}-12-31`] };
    }
    if (query.company_id) where.company_id = query.company_id;
    return CompanyHoliday.findAll({ where, order: [['holiday_date', 'ASC']] });
  }

  static async getById(id: number) {
    const holiday = await CompanyHoliday.findByPk(id);
    if (!holiday) throw { statusCode: 404, message: 'Holiday not found' };
    return holiday;
  }

  static async create(data: any, actionBy?: number) {
    const holiday = await CompanyHoliday.create(data);
    await logAudit('company_holidays', holiday.id, 'CREATE', null, holiday.toJSON(), actionBy);
    return holiday;
  }

  static async update(id: number, data: any, actionBy?: number) {
    const holiday = await CompanyHoliday.findByPk(id);
    if (!holiday) throw { statusCode: 404, message: 'Holiday not found' };
    const oldData = holiday.toJSON();
    await holiday.update(data);
    await logAudit('company_holidays', id, 'UPDATE', oldData, holiday.toJSON(), actionBy);
    return holiday;
  }

  static async delete(id: number, actionBy?: number) {
    const holiday = await CompanyHoliday.findByPk(id);
    if (!holiday) throw { statusCode: 404, message: 'Holiday not found' };
    await logAudit('company_holidays', id, 'DELETE', holiday.toJSON(), null, actionBy);
    await holiday.destroy();
    return { message: 'Holiday deleted' };
  }
}
