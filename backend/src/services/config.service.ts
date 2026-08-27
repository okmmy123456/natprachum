import { SystemConfig } from '../models';
import { logAudit } from './auditlog.service';

export class ConfigService {
  static async getAll() {
    return SystemConfig.findAll({ order: [['config_key', 'ASC']] });
  }

  static async get(key: string) {
    return SystemConfig.findOne({ where: { config_key: key } });
  }

  static async getValue(key: string, defaultValue: string = ''): Promise<string> {
    const config = await SystemConfig.findOne({ where: { config_key: key } });
    return config?.config_value || defaultValue;
  }

  static async set(key: string, value: string, type: string = 'string', description?: string, updatedBy?: number) {
    const [config, created] = await SystemConfig.findOrCreate({
      where: { config_key: key },
      defaults: { config_key: key, config_value: value, config_type: type as any, description, updated_by: updatedBy },
    });

    if (!created) {
      const oldData = config.toJSON();
      await config.update({ config_value: value, updated_by: updatedBy });
      await logAudit('system_configs', config.id, 'UPDATE', oldData, config.toJSON(), updatedBy);
    }

    return config;
  }

  static async bulkUpdate(configs: Array<{ key: string; value: string }>, updatedBy?: number) {
    for (const c of configs) {
      await this.set(c.key, c.value, 'string', undefined, updatedBy);
    }
    return await this.getAll();
  }
}
