import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import AdmZip from 'adm-zip';

const projectRoot = resolve(import.meta.dirname, '..');
const distZip = join(projectRoot, 'komari-theme-purcarte.zip');

console.log('📦 开始构建 Komari PurCarte 主题包...');

try {
  // 1. 执行 TypeScript 检查与 Vite 生产打包
  console.log('🔨 1/3 正在编译前端代码...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

  // 2. 检查必要产物
  console.log('🔍 2/3 检查必要文件...');
  const requiredFiles = ['komari-theme.json', 'preview.png', 'dist'];
  for (const file of requiredFiles) {
    if (!existsSync(join(projectRoot, file))) {
      throw new Error(`缺少必要文件或目录: ${file}`);
    }
  }

  // 3. 使用 adm-zip 创建 ZIP（adm-zip 会自动使用正斜杠处理内部路径）
  console.log('⚡ 3/3 压缩打包主题 ZIP...');

  // 如果目标 zip 已存在先清理
  if (existsSync(distZip)) {
    rmSync(distZip, { force: true });
  }

  const zip = new AdmZip();

  // 添加文件到根目录
  zip.addLocalFile(join(projectRoot, 'komari-theme.json'));
  zip.addLocalFile(join(projectRoot, 'preview.png'));
  
  // 添加 dist 目录（放入 zip 的 dist 目录内）
  zip.addLocalFolder(join(projectRoot, 'dist'), 'dist');

  // 写入磁盘
  zip.writeZip(distZip);

  console.log(`\n🎉 主题包成功打包于: ${distZip}`);
} catch (err) {
  console.error('❌ 打包失败:', err);
  process.exit(1);
}
