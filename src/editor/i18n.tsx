import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { readPreference, savePreference } from './preferences';
import { workflowEn, workflowZh } from './workflow-i18n';
export { readPreference, savePreference } from './preferences';

export type Language = 'en' | 'zh';
export const LANGUAGE_KEY = 'mesh-avatar-language';
export const GUIDE_KEY = 'mesh-avatar-guide-seen';

const en = {
  ...workflowEn,
  product: 'Mesh Avatar Studio', subtitle: 'Shape the motion in your illustration',
  tools: 'Project tools', openProject: 'Open project', openRig: 'Load rig.json only…', openFolder: 'Browse for a project folder…',
  rigFile: 'Open rig file', folderFiles: 'Open project folder files', save: 'Save rig', undo: 'Undo', redo: 'Redo',
  projectHelp: 'A project is the folder an agent created from your illustration: rig.json, source.png and built/.',
  recent: 'Recent', noRecent: 'No recent projects.', clearHistory: 'Clear history', removeRecent: 'Remove from history',
  reopenLast: 'Reopen last project on start', browseAgain: 'Browse again', missingRecent: 'Project no longer exists; removed from history:',
  localProjects: 'Local projects', noProjects: 'No local projects yet.', sampleProject: 'Sample project', updated: 'Updated',
  drawnVariants: 'Drawn eyes/mouths', readOnly: 'Read-only', copyPath: 'Copy path', copyFolderPath: 'Copy folder path', copied: 'Path copied',
  showFinder: 'Show in Finder', showFolder: 'Open folder', unknownPath: 'Browser-picked project · full path unavailable',
  savedTo: 'Saved to', saveError: 'Could not save the project. Your edits are still in the editor; try again.', revealError: 'Could not open the project folder.', copyError: 'Could not copy the path.',
  help: 'Help', close: 'Close help', language: 'Language', english: 'English', chinese: 'Chinese', enCode: 'EN', zhCode: 'ZH',
  parts: 'Parts', faceSection: 'Face', hairSection: 'Hair & accessories', bodySection: 'Body', advanced: 'Advanced',
  notPresent: 'Not in this rig', show: 'Show overlay', hide: 'Hide overlay', showAll: 'Show all', hideAll: 'Hide all',
  source: 'Source & rig', canvas: 'Rig editor canvas', fit: 'Fit', zoom: 'Zoom', zoomOut: 'Zoom out', zoomIn: 'Zoom in', actualSize: 'Reset to 100%', fitPart: 'Fit selected part', wheelMode: 'Mouse wheel', wheelAuto: 'Zoom', wheelPan: 'Scroll to pan',
  pickHint: 'Pick a part on the left, or click a dot', dragHint: 'Drag dots to move them',
  lineHint: 'Drag dots · double-click a line to add a dot · Alt-click a dot to remove it',
  panHint: 'Pinch to zoom · scroll or drag empty space to pan', noDots: 'Edit the values in the selected part card',
  preview: 'Live preview', idle: 'Idle motion', play: 'Play idle motion', pause: 'Pause idle motion',
  pose: 'Pose test', reset: 'Reset', sweep: 'Sweep angles', stopSweep: 'Stop sweep',
  lipSync: 'Lip sync', release: 'Release', lipText: 'Kana text', lipPlay: 'Play', lipStop: 'Stop',
  lipSpeed: 'Morae per second', lipLoop: 'Loop', skippedKana: 'Skipped characters:', lipHelp: 'Hiragana, katakana and spaces. Preview only; no audio.',
  sweepTip: 'Swings the head through its full range to find tears',
  turn: 'Turn left/right', look: 'Look up/down', tilt: 'Tilt', eyeOpen: 'Eyes open', mouthOpen: 'Mouth open', bodyTilt: 'Body tilt',
  loading: 'Loading local assets…', updating: 'Updating preview…', ready: 'Engine ready', previewError: 'Preview could not load',
  selection: 'Selected part', selectedItem: 'Selected rig item', selectPart: 'Select a part to edit it', tip: 'Tip',
  guideTitle: 'Three steps to your first edit', guide1: 'Pick a part on the left', guide2: 'Drag its dots on the image',
  guide3: 'Watch the preview on the right', gotIt: 'Got it', shortcuts: 'Keyboard & mouse', guideAgain: 'Show the guide again',
  shortcutUndo: 'Undo / redo', shortcutSave: 'Save rig', shortcutPan: 'Pan the image', shortcutZoom: 'Zoom the image',
  shortcutVertex: 'Add / remove a dot', spaceDrag: 'Space + drag', wheel: 'Scroll', vertexKeys: 'Double-click a line / Alt-click a dot',
  stale: 'Outlines changed. The preview still uses the previous layers.',
  changedParts: 'Changed parts', checking: 'Checking for sample images…', emptyTitle: 'Open a project',
  emptyHelp: 'Choose a project from Open project, or browse for its folder.',
  newProjectHelp: 'Starting from a new illustration? Ask your agent to prepare a project using the agent guide.',
  invalidRig: 'Could not open the rig file. Check the JSON and these field paths:',
  invalidFolder: 'Could not open this folder. Check rig.json and layers.json for invalid data.',
  missingFolderFiles: 'Required files are missing. Include source.png, layers.json and every cut-out image.',
  unreadableFolder: 'A file or folder could not be read. Check access permissions and whether another app is using it, then try again.',
  unreadableProject: 'Cannot read this project. Check permissions or whether the file is in use.',
  invalidValue: 'Check the values at these field paths:', point: 'point', node: 'node', strand: 'Strand', eye: 'Eye',
  accessory: 'Accessory', x: 'X', y: 'Y', px: 'px',
};
const zh: typeof en = {
  ...workflowZh,
  product: 'Mesh Avatar Studio', subtitle: '调整插画的活动范围',
  tools: '项目操作', openProject: '打开项目', openRig: '仅载入 rig.json…', openFolder: '选择项目文件夹…',
  rigFile: '打开配置文件', folderFiles: '打开项目文件夹中的文件', save: '保存设置', undo: '撤销', redo: '重做',
  projectHelp: '项目是 AI 智能体根据插画创建的文件夹（包含 rig.json、source.png、built/）。',
  recent: '最近打开', noRecent: '暂无历史记录。', clearHistory: '清除历史', removeRecent: '从历史中删除',
  reopenLast: '启动时打开上次的项目', browseAgain: '重新选择文件夹', missingRecent: '项目已不存在，已从历史中删除：',
  localProjects: '本地项目', noProjects: '还没有项目。', sampleProject: '示例', updated: '更新',
  drawnVariants: '眼・口手绘差分', readOnly: '只读', copyPath: '复制路径', copyFolderPath: '复制文件夹路径', copied: '路径已复制',
  showFinder: '打开文件夹', showFolder: '打开文件夹', unknownPath: '浏览器选择 · 无法获取完整路径',
  savedTo: '已保存：', saveError: '项目保存失败。编辑内容仍保留在界面中，请重试。', revealError: '无法打开项目文件夹。', copyError: '路径复制失败。',
  help: '帮助', close: '关闭帮助', language: '语言', english: '英文', chinese: '中文', enCode: '英文', zhCode: '中文',
  parts: '部件', faceSection: '脸部', hairSection: '头发・饰品', bodySection: '身体', advanced: '高级设置',
  notPresent: '此配置中没有', show: '显示辅助线', hide: '隐藏辅助线', showAll: '全部显示', hideAll: '全部隐藏',
  source: '原图与活动范围', canvas: '活动范围编辑画布', fit: '适应窗口', zoom: '缩放', zoomOut: '缩小', zoomIn: '放大', actualSize: '恢复 100%', fitPart: '定位到所选部件', wheelMode: '鼠标滚轮', wheelAuto: '缩放', wheelPan: '滚动平移',
  pickHint: '在左侧选择部件，或点击图中的点', dragHint: '拖动点以调整位置',
  lineHint: '拖动点 · 双击线条添加点 · ⌥+点击删除点',
  panHint: '双指缩放 · 滚动或拖动空白处平移', noDots: '在右侧所选部件卡片中调整数值',
  preview: '动作预览', idle: '待机动作', play: '播放待机动作', pause: '暂停待机动作',
  pose: '姿态检查', reset: '重置', sweep: '连续扫角度', stopSweep: '停止连续检查',
  lipSync: '口型', release: '解除', lipText: '假名文本', lipPlay: '播放', lipStop: '停止',
  lipSpeed: '每秒拍数', lipLoop: '循环', skippedKana: '跳过的字符：', lipHelp: '支持平假名・片假名・空格。仅预览，无声音。',
  sweepTip: '把头转到最大角度，检查图片的缝隙和破损',
  turn: '左右转头', look: '上下转头', tilt: '歪头', eyeOpen: '眼睛开合', mouthOpen: '嘴开合', bodyTilt: '身体倾斜',
  loading: '正在加载图片…', updating: '正在更新预览…', ready: '预览就绪', previewError: '预览加载失败',
  selection: '所选部件', selectedItem: '选择部件', selectPart: '请选择部件进行编辑', tip: '调整技巧',
  guideTitle: '三步完成第一次编辑', guide1: '在左侧列表中选择部件', guide2: '拖动图中的点',
  guide3: '在右侧预览中查看动作', gotIt: '知道了', shortcuts: '键盘・鼠标操作', guideAgain: '再次显示使用说明',
  shortcutUndo: '撤销／重做', shortcutSave: '保存设置', shortcutPan: '平移图片', shortcutZoom: '缩放图片',
  shortcutVertex: '添加／删除点', spaceDrag: '空格＋拖动', wheel: '滚轮', vertexKeys: '双击线条／⌥+点击点',
  stale: '轮廓已更改。预览仍使用更改前的图层。',
  changedParts: '已更改的部件', checking: '正在检查示例图片…', emptyTitle: '打开项目',
  emptyHelp: '从「打开项目」列表中选择，或指定文件夹。',
  newProjectHelp: '要用新插画开始？请让智能体按操作指南准备项目。',
  invalidRig: '配置文件打开失败。请检查 JSON 格式和以下字段：',
  invalidFolder: '文件夹打开失败。请准备 source.png、rig.json、layers.json 和所有裁剪图。',
  missingFolderFiles: '缺少必需文件。请确保包含 source.png、layers.json 和所有拆分图层图片。',
  unreadableFolder: '无法读取文件或文件夹。请检查访问权限，或是否正被其他应用占用，然后重试。',
  unreadableProject: '无法读取此项目。请检查访问权限，或文件是否正被占用。',
  invalidValue: '请检查以下字段的数值：', point: '点', node: '节点', strand: '发束', eye: '眼睛',
  accessory: '饰品', x: '横', y: '纵', px: '像素',
};
export const dictionaries = { en, zh };
export type PartGroup = 'head' | 'eyes' | 'mouth' | 'face' | 'cheeks' | 'strands' | 'buns' | 'accessories' | 'body' | 'hand' | 'mesh' | 'view';
const partText: Record<Language, Record<PartGroup, [string, string, string]>> = {
  en: {
    head: ['Head turn', 'Area that moves when the face turns or tilts.', 'Place the centre in the middle of the face; the circle should cover the whole head including hair.'],
    eyes: ['Eyes', 'Outline of each eye opening; drives blinking and gaze.', 'Trace the opening inside the eyelashes. Add dots where the contour changes direction.'],
    mouth: ['Mouth', 'Closed-mouth line and the area for drawn mouth shapes.', 'Align the line with the closed mouth, and keep the surrounding area close to the lips.'],
    face: ['Face features', 'Soft regions for nose, ears, brows and jaw.', 'Keep each region centred on its feature; adjust its size for a smooth transition.'],
    cheeks: ['Blush', 'Where the blush appears.', 'Place one dot on each cheek, below the eyes.'],
    strands: ['Hair strands', 'Lines that sway with physics.', 'Follow each strand from its root to its tip. Keep the root close to the scalp.'],
    buns: ['Hair buns', 'Regions that bob as a whole.', 'Fit each circle around a bun without including the face.'],
    accessories: ['Accessories', 'Pendulum parts such as tassels.', 'Place the pivot where the accessory attaches and the tip at its lowest point.'],
    body: ['Body', 'Breathing and body sway.', 'Keep the rotation pivot low and place the breathing region over the chest.'],
    hand: ['Hand', 'Hand outline and arm joints.', 'Trace the hand outline, then place the wrist and elbow joints.'],
    mesh: ['Mesh', 'Mesh density.', 'Smaller cells add detail around the face but take more time to render.'],
    view: ['Framing', 'Preview margins.', 'Adjust the margins so the head and accessories stay inside the preview.'],
  },
  zh: {
    head: ['头的朝向', '转头或歪头时活动的范围。', '把中心放在脸部正中，圆圈覆盖含头发在内的整个头部。'],
    eyes: ['眼睛', '眼睛开口的轮廓，用于眨眼和视线。', '沿睫毛内侧描出轮廓，在转折处加点。'],
    mouth: ['嘴', '闭嘴时的线条与嘴型差分替换范围。', '让线条贴合闭着的嘴，周围范围收在嘴唇附近。'],
    face: ['面部部件', '鼻・耳・眉・下巴的影响范围。', '把每个范围对准部件中心，调整大小让动作过渡自然。'],
    cheeks: ['腮红', '腮红出现的位置。', '在左右脸颊、眼睛下方各放一个点。'],
    strands: ['发束', '随物理摆动的发丝。', '从发根到发梢描线，发根贴近头皮。'],
    buns: ['发髻', '整体晃动的范围。', '用圆圈圈住发髻，不要包含脸部。'],
    accessories: ['饰品', '流苏等摆动部件。', '在系着的位置放支点，最下端放末梢。'],
    body: ['身体', '呼吸与身体晃动。', '把旋转支点放低，呼吸范围对准胸部。'],
    hand: ['手', '手的轮廓与手臂关节。', '先描出手的轮廓，再放好手腕和手肘的位置。'],
    mesh: ['网格', '网格密度。', '格子越细脸部表现越精细，但绘制负担越大。'],
    view: ['显示范围', '预览的边距。', '调整边距，让头和饰品不超出预览。'],
  },
};
const fieldText: Record<string, [string, string]> = {
  image: ['Source image', '元图'],
  center: ['Centre', '中心'], pivot: ['Pivot', '支点'], rx: ['Horizontal radius', '横向半径'], ry: ['Vertical radius', '纵向半径'],
  cx: ['Centre X', '中心横坐标'], cy: ['Centre Y', '中心纵坐标'], shiftX: ['Horizontal travel', '横向移动量'], shiftY: ['Vertical travel', '纵向移动量'],
  pivotX: ['Pivot X', '支点横坐标'], pivotY: ['Pivot Y', '支点纵坐标'], maxRoll: ['Maximum tilt', '最大倾斜'],
  weightBand: ['Head blend range', '头部影响范围'], turnBand: ['Turn blend range', '转头影响范围'], breathBand: ['Breathing range', '呼吸影响范围'],
  rollBand: ['Body tilt range', '身体倾斜范围'], chest: ['Chest', '胸'], shoulders: ['Shoulders', '肩'],
  nose: ['Nose', '鼻'], eyeA: ['First eye', '第一只眼'], eyeB: ['Second eye', '第二只眼'], earL: ['Left ear', '左耳'], earR: ['Right ear', '右耳'],
  brow: ['Brows', '眉'], jaw: ['Jaw', '下巴'], band: ['Blend range', '影响范围'], bunL: ['Left bun', '左发髻'], bunR: ['Right bun', '右发髻'],
  opening: ['Opening', '开口'], roi: ['Cut-out region', '裁剪区'], x0: ['Left edge', '左端'], x1: ['Right edge', '右端'], y0: ['Top edge', '上端'], y1: ['Bottom edge', '下端'],
  top: ['Upper lid curve', '上眼睑曲线'], bot: ['Lower lid curve', '下眼睑曲线'], angle: ['Angle', '角度'], halfLen: ['Half length', '半长'],
  bow: ['Curve depth', '曲线深度'], area: ['Drawing area', '差分范围'], nodes: ['Nodes', '节点'], sigma: ['Sway width', '摆动宽度'],
  k: ['Sway strength', '摆动强度'], max: ['Maximum sway', '最大摆动'], tip: ['Tip', '末梢'], split: ['Joint split', '关节分割位置'],
  box: ['Cut-out box', '裁剪框'], color: ['Colour mask', '颜色遮罩'], redness: ['Red threshold', '红色阈值'], minRed: ['Minimum red', '红色最小值'],
  outline: ['Outline', '轮廓'], jawRange: ['Jaw range', '下巴范围'], background: ['Background patch', '背景补全范围'],
  elbow: ['Elbow', '手肘'], wrist: ['Wrist', '手腕'], knuckle: ['Knuckle', '指根'], contact: ['Contact point', '接触点'],
  forearmShare: ['Forearm movement', '前臂移动比例'], armBand: ['Arm blend range', '手臂影响范围'], wristBand: ['Wrist blend range', '手腕影响范围'],
  handBand: ['Hand blend range', '手部影响范围'], fingerXBand: ['Finger horizontal range', '手指横向范围'], fingerYBand: ['Finger vertical range', '手指纵向范围'], pinBand: ['Pinned range', '固定范围'],
  baseCell: ['Base cell size', '基础格宽'], fine: ['Fine mesh region', '精细网格范围'], cell: ['Cell size', '格宽'],
  handCell: ['Hand cell size', '手部格宽'], tasselCell: ['Accessory cell size', '饰品格宽'], eyeBallCell: ['Iris cell size', '瞳孔格宽'],
  eyeCell: ['Eye cell size', '眼部格宽'], spriteCell: ['Drawing cell size', '差分图格宽'],
  padTop: ['Top margin', '上边距'], padSide: ['Side margin', '左右边距'], gazeCenter: ['Gaze centre', '视线中心'], start: ['Start', '起点'], end: ['End', '终点'],
};
export function fieldTitle(path: string, language: Language) {
  const t = dictionaries[language];
  const parts = partText[language];
  return path.split('.').map((key, i) => {
    if (/^\d+$/.test(key)) return String(Number(key) + 1);
    if (i === 0) {
      if (key === 'eyes') return t.eye;
      if (key === 'strands') return t.strand;
      if (key === 'accessories') return t.accessory;
      if (key in parts) return parts[key as PartGroup][0];
    }
    return fieldText[key]?.[language === 'en' ? 0 : 1] ?? key;
  }).join(' · ');
}
const Context = createContext({ language: 'en' as Language, setLanguage: (_: Language) => { void _; } });
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = readPreference(LANGUAGE_KEY);
    return saved === 'zh' || saved === 'ja' ? 'zh' : 'en';
  });
  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-CN' : language; savePreference(LANGUAGE_KEY, language); }, [language]);
  return <Context.Provider value={{ language, setLanguage }}>{children}</Context.Provider>;
}
export function useI18n() {
  const context = useContext(Context);
  return { ...context, t: dictionaries[context.language], parts: partText[context.language], locale: { en: 'en-GB', zh: 'zh-CN' }[context.language],
    title: (path: string) => fieldTitle(path, context.language) };
}
