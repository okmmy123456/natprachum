import { Company } from './src/models';

const companies = [
  {"id":"1","company_name":"THONGCHAI INDUSTRIES CO., LTD.","company_code":"TCI"},
  {"id":"2","company_name":"THAI RADIATOR MFG. CO.,LTD.","company_code":"TRM"},
  {"id":"3","company_name":"THONGCHAI MITOYO CO., LTD.","company_code":"TMC"},
  {"id":"4","company_name":"AGS AUTO PARTS CO., LTD.","company_code":"AGS"},
  {"id":"5","company_name":"TR ASIA CO.,LTD.","company_code":"TRA"},
  {"id":"6","company_name":"TR TECHNICAL CENTER Co.,LTD.","company_code":"TTC"},
  {"id":"7","company_name":"THONGCHAI MANUFACTURING CO.,LTD.","company_code":"TCM"}
];

async function seed() {
  try {
    for (const c of companies) {
      const existing = await Company.findByPk(c.id);
      if (existing) {
        await existing.update({ company_name: c.company_name, company_code: c.company_code });
      } else {
        await Company.create({ id: Number(c.id), company_name: c.company_name, company_code: c.company_code });
      }
    }
    console.log('Successfully seeded companies!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding companies:', err);
    process.exit(1);
  }
}

seed();
