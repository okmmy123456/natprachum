import { Equipment } from '../models';

const equipments = [
  { equipment_name: 'TV', equipment_code: 'TV', icon: 'tv' },
  { equipment_name: 'Projector', equipment_code: 'PROJECTOR', icon: 'videocam' },
  { equipment_name: 'Whiteboard', equipment_code: 'WHITEBOARD', icon: 'dashboard' },
  { equipment_name: 'Speaker', equipment_code: 'SPEAKER', icon: 'volume_up' },
  { equipment_name: 'HDMI', equipment_code: 'HDMI', icon: 'settings_input_hdmi' },
  { equipment_name: 'Video Conference', equipment_code: 'VIDEO_CONF', icon: 'video_call' },
];

export const seedEquipments = async () => {
  for (const eq of equipments) {
    await Equipment.findOrCreate({
      where: { equipment_code: eq.equipment_code },
      defaults: eq,
    });
  }
  console.log('  🔧 Equipments seeded');
};
