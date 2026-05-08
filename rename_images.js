const fs = require('fs');
const path = require('path');

const assetsDir = 'd:\\Work\\Priiyanka\\frontend\\public\\assets';

const renameMap = {
  'Dry massage.jpeg': 'Dry_massage.jpeg',
  'Valuka sveda.jpeg': 'Valuka_sveda.jpeg',
  'Kati basti.jpeg': 'Kati_basti.jpeg',
  'Shiro basti.jpeg': 'Shiro_basti.jpeg',
  'Shiro pichu.jpeg': 'Shiro_pichu.jpeg',
  'Pinda sveda.jpeg': 'Pinda_sveda.jpeg',
  'Herbal steam bath.jpeg': 'Herbal_steam_bath.jpeg',
  'Janu basti.jpeg': 'Janu_basti.jpeg',
  'Karna purana.jpeg': 'Karna_purana.jpeg',
  'Marma therapy.jpeg': 'Marma_therapy.jpeg',
  'Nara cupping.jpeg': 'Nara_cupping.jpeg',
  'Shakti shali pinda sveda.jpeg': 'Shakti_shali_pinda_sveda.jpeg'
};

Object.entries(renameMap).forEach(([oldName, newName]) => {
  const oldPath = path.join(assetsDir, oldName);
  const newPath = path.join(assetsDir, newName);
  
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`✓ Renamed: ${oldName} → ${newName}`);
  } else {
    console.log(`✗ File not found: ${oldName}`);
  }
});

console.log('\nFiles in assets directory after renaming:');
fs.readdirSync(assetsDir).forEach(file => {
  console.log(`  - ${file}`);
});
