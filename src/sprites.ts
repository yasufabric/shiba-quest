export interface Sprite {
  w: number;
  h: number;
  rows: readonly string[];
}

/** Original battle sprites. About 16 colors, drawn for a 256×224 framebuffer. */
export const palette: Record<string, string> = {
  k: '#140e0c',
  d: '#6e3018',
  o: '#d8702a',
  l: '#f6b064',
  w: '#f6e6ce',
  s: '#c4a888',
  e: '#fffaf4',
  t: '#c8404e',
  c: '#e2968c',
  u: '#201634',
  m: '#5c3e80',
  v: '#a88cc8',
  h: '#5a4030',
  q: '#ecdcc4',
  n: '#2a2040',
  p: '#0c0808',
};

export const hero: Sprite = {
  w: 24,
  h: 32,
  rows: [
    '........................',
    '........................',
    '........................',
    '........................',
    '.................kk.....',
    '................kook....',
    '...............koolk....',
    '..............koollk....',
    '..kk.........koolllk....',
    '.kook.......koowwllk....',
    'koloookooooowwwepok.....',
    'kllllookowwwoowwwpok....',
    '.klllkowwwwwosswwpok....',
    '..kookowwwwwoooowwpk....',
    '...kkowwwwwwooooowpk....',
    '....kwwwwwwooooooook....',
    '....kwwwwwoooooooook....',
    '....kwwwwwoooooooook....',
    '....kooooooooooooook....',
    '.....koooooooooooook....',
    '.....kkooooooooooook....',
    '......kkoooooooooook....',
    '.......kkkooooooook.....',
    '........kkkkkkkkkkk.....',
    '.......kk........kk.....',
    '......kdk........kdk....',
    '......kok........kok....',
    '......kdk........kdk....',
    '......kok........kok....',
    '......ksk........ksk....',
    '......kwk........kwk....',
    '.......k..........k.....',
  ],
};

export const dumpling: Sprite = {
  w: 40,
  h: 36,
  rows: [
    '........................................',
    '........................................',
    '........................................',
    '...................kkk..................',
    '..............kkkkkkmkkkkkk.............',
    '............kkkvvvmmmmmmmmkkk...........',
    '.......kkkkkkvvvmmmmmmmmmmmmkkkkkk......',
    '.......kkkkvkvvmkmmmkmmmkmmmkmkkkk......',
    '.......kuuuuuuuuuuuuuuuuuuuuuuuuuk......',
    '.......kvvvvvmmmvmmmvmmmvmmmvmmmvk......',
    '.......kvvvmmmmmmmmmmmmmmmmmmmmuuk......',
    '......kkvmmmmmmmmmmmmmmmmmmmmuuuukk.....',
    '......kvmmmmmmmmmmmmmmmmmmmmuuuuuuk.....',
    '......kmkkmmmmmmmmmmmmmmmmmuuuukkuk.....',
    '......kmkekkkmmkeeekmmmmmuuukkkuuuk.....',
    '.....kkmkeppkkkkeppkmmmmuukkuuuuuukk....',
    '.....kmmkeeekmmkeeekmmuuuuuucuuuuuuk....',
    '.....kkmmmcccccmmmmmmuuuuucccccuuukk....',
    '......kmmcccccccmmmuuuuuucccccccuuk.....',
    '....kkkmmmcccccmmmuuuuuuuucccccuuukkk...',
    '..kkkmkmmmmmcmmmmuuuuuuuuuuucuuuuukmkkk.',
    '.kkmmmmmmmmmmmmuuuuuuuuuuuuuuuuuummmmmkk',
    '.kmmmmmmmmmmmmuuuuktttkuuuuuuuuummmmmmmk',
    '.kkmmmmmkmmmuuuuuuktttkuuuuuuuuukmmmmmkk',
    '..kkkmkkkkmuuuuuuuuuuuuuuuuuuuukkkkmkkk.',
    '....kkk..kkuuuuuuuuuuuuuuuuuuukk..kkk...',
    '..........kkkuuuuuuuuuuuuuuukkk.........',
    '............kkkuuuuuuuuuuukkk...........',
    '..............kkkkkkukkkkkk.............',
    '...........kkkkkkkkkkkkkkkkkkk..........',
    '...........kuuuuuuk...kuuuuuuk..........',
    '...........kuuuuuuk...kuuuuuuk..........',
    '...........kuuuuuuk...kuuuuuuk..........',
    '...........kuuuuuuk...kuuuuuuk..........',
    '...........kkuuuuuk...kuuuuuuk..........',
    '...........kkkkkkkk...kkkkkkkk..........',
  ],
};

export const imp: Sprite = {
  w: 56,
  h: 62,
  rows: [
    '.............kqqkkk.......................khhqqk........',
    '.............kqqqhk......................kkhqqkk........',
    '.............kkqqhkk....................kkhhhhk.........',
    '..............khhhhk...................kkhhhhkk.........',
    '..............kkhhhkk..................khhhhkk.kkk......',
    '...............khhhhk.................kkhhhkk.kkvkk.....',
    '...........kkk.kkhhhkk...............kkhhhhk.kkmmmk.....',
    '..........kkvkk.khhhhk...............khhhhkkkkmmmkk.....',
    '..........kvvvkkkkhhhkk.............kkhhhkkkkmmmkk......',
    '..........kkvvvkkkhhhhk............kkhhhhkkkmmmkk.......',
    '...........kvvvvkkkhhhkk.....kkk..kkhhhhkkkmmmkk........',
    '...........kkvvvkkkhhhhk.kkkkkvkkkkhhhhkkkmmmkk.........',
    '............kkvvvkkkhhhkkkvvvvvvvvvhhhkkkmmmkk..........',
    '.............kkvvvkkhhhhvvvvvvvvvvvhhhkkmmmkk...........',
    '..............kvvvvkkhhhvvvvvvvvvvvvmmmmmmkk............',
    '..............kkvvvkkhhhvvvvvvvvvvmmmmmmmkk.............',
    '...............kkvvvvvvvvvvvvvvvvmmmmmmmmk..............',
    '................kkvkvvvvkkvvvvvvmmmkkmmmmkk.............',
    '.................kkvvvvvkekkkvkeekkmmmmmmmk.............',
    '.......kkk........kvvvvvkeppkkkkkpkmmmmmmmk....kkk......',
    '...kkkkknkkkk.....kvvvvvkeeekmkeeekmmmmmmmk.kkkknkkkkk..',
    '..kkunnnnnnnkk...kkvvvvvvvmmmmmmmmmmmmmmmmkkknnnnnnnukk.',
    '..kuuunnnnnnnkk..kvvvvvvmmmmmmmmmmmmmmmmmmmknnnnnnnuuuk.',
    '.kknuuunnnnnnnkk.kkvvvvmmmmmmmmmmmmmmmmmmmknnnnnnnuuunkk',
    '.knnnuunnnnnnnnk..kvvvmmmmmmmmmmmmmmmmmmmmnnnnnnnnuunnnk',
    'kknnnuuunnnnnnnkk.kvmmmmmmmmmmmmmmmmmmmmuunnnnnnnuuunnnk',
    'knnnnnuuunnnnnnnkkkmmmmmmmmkttttttkmmmmuuunnnnnnuuunnnnn',
    'knnnnnnuuunnnnnnkkmmmmmmmmmmktttteemmuuuunnnnnnuuunnnnnn',
    'knnnnnnuuunnnnnnkkmmmmmmmmmmmmmmmmmmuuuuunnnnnnuuunnnnnn',
    'knnnnnnnuuunnnnnkmmmmmmmmmmmmmmmmmmuuuuuknnnnnuuunnnnnnn',
    'nnnnnnnnnuuunnnnmmmmmmmmmmmmmmmmmuuuuuuuunnnnuuunnnnnnnn',
    'knnnnnnnnuuunnnnmmmmmmmmmmmmmmmmuuuuuuuuuuunnuuunnnnnnnn',
    'knnnnnnnnnuuunnnmmmmmmmmmmmmmmuuuuuuuuuuuuuuuuunnnnnnnnn',
    'knnnnnnnnnnuuunmmmmmmmmmmmmmmuuuuuuuuuuuuuuuuunnnnnnnnnn',
    'knnnnnnnnnnnuummmmmmmmmmmmmuuvuuuuuuuuuuuuuuuuunnnnnnnnn',
    'kknnnnnnnnnnummmmmmmmmmmmmvvvvvvvuuuuuuuuuuuuuuunnnnnnnk',
    '.knnnnnnnnnnmmmmmmmmmmmmmvvvvvvvvvuuuuuuuuuuuuuuuunnnnnk',
    '.kknnnnnnnmmmmmmmmmmmmmuvvvvvvvvvvvuuuuuuuunnuuuuuuunnkk',
    '..kknnnnnmmmmmmmmmmmmmuvvvvvvqvvvvvvuuuuuuuknnuuuuuuukqq',
    '...kknnnmmmmmkkmmmmmuuuvvvvqqqqqvvvvuuuuuukkknnuuuuuuqqk',
    '....kkmmmmmkkkkmmmmuuuuvvvqqqqqqqvvvuuuuuuk.kkkknuuuqquk',
    '....kmmmmmkk..kmmuuuuuuvvvqqqqqqqvvvuuuuuuk....kkkuuqqkk',
    '....kmmmmkk...kmuuuuuuvvvvqqqqqqqvvvvuuuuuk......kkkqkqq',
    '....kmmmkk....kuuuuuuuuvvqqqqqqqqqvvuuuuuuk........kkqkk',
    '....kkkkk.....kkuuuuuuuvvvqqqqqqqvvvuuuuukk.........kkqk',
    '...............kuuuuuuuvvvqqqqqqqvvvuuuuuk...........kkq',
    '...............kuuuuuuuvvvqqqqqqqvvvuuuuuk............kk',
    '...............kkuuuuuuuvvvqqqqqvvvuuuuukk..............',
    '................kkuuuuuuuvvvvqvvvvuuuuukk...............',
    '.................kuuuuuuuuvvvvvvvuuuuuuk................',
    '.................kkuuuuuuuuuuvuummmmmmmk................',
    '..................kkuuuuuuuuuuuummmmmmmk................',
    '...................kuuuuuuuuuuuummmmmmmk................',
    '...................kuuuuuuuuuuuummmmmmmk................',
    '...................kuuuuuuukukkkmmmmmmmk................',
    '...................kuuuuuuukkk.kmmmmmmmk................',
    '.................kkkuuuuuuukkk.kmmmmmmmkkkkk............',
    '.................kuuuuuuuuuuuk.kmmmmmmmmmmmk............',
    '.................kuuuuuuuuuuuk.kmmmmmmmmmmmk............',
    '.................kuuuuuuuuuuuk.kmmmmmmmmmmmk............',
    '.................kuuuuuuuuuuuk.kmmmmmmmmmmmk............',
    '.................kkkkkkkkkkkkk.kkkkkkkkkkkkk............',
  ],
};

export const boss: Sprite = {
  w: 104,
  h: 116,
  rows: [
    '.................kkk.................................................................kkk................',
    '................kkqkk...............................................................kkqkk...............',
    '...............kkqqqk...............................................................kqqqkk..............',
    '...............kqqqkk...............................................................kkqqqk..............',
    '..............kkqqqk.................................................................kqqqkk.............',
    '.............kkqqqkk.................................................................kkqqqkk............',
    '............kkqqqkk...................................................................kkqqqkk...........',
    '...........kkhqqqk.....................................................................kqqqhkk..........',
    '...........khqqqhkk...................................................................kkhqqqhk..........',
    '...........kkhqhhhkk.................................................................kkhhhqhkk..........',
    '............kkhhhhhkk...............................................................kkhhhhhkk...........',
    '.............kkhhhhhkk.............................................................kkhhhhhkk............',
    '..............kkhhhhhkk...........................................................kkhhhhhkk.............',
    '...............kkhhhhhkkk.......................................................kkkhhhhhkk..............',
    '................kkhhhhhhkk.....................................................kkhhhhhhkk...............',
    '.................kkhhhhhhkk...................................................kkhhhhhhkk................',
    '..................kkhhhhhhkk.................................................kkhhhhhhkk.................',
    '...................khhhhhhhkk...............................................kkhhhhhhhk..................',
    '...................kkhhhhhhhkk.............................................kkhhhhhhhkk..................',
    '....................kkhhhhhhhkk...........................................kkhhhhhhhkk...................',
    '.....................kkhhhhhhhkk.........................................kkhhhhhhhkk....................',
    '......................kkhhhhhhhkk.......................................kkhhhhhhhkk.....................',
    '.......................kkhhhhhhhkk.....................................kkhhhhhhhkk......................',
    '........................kkhhhhhhhkk................kkk................kkhhhhhhhkk.......................',
    '.........................kkhhhhhhhkk.........kkkkkkkvkkkkkkk.........kkhhhhhhhkk........................',
    '..........................kkhhhhhhhkk.....kkkkvvvvvvvvvvvvvkkkk.....kkhhhhhhhkk.........................',
    '...........................kkhhhhhhhkk..kkkvvvvvvvvvvvvvvvvvvvkkk..kkhhhhhhhkk..........................',
    '............................kkhhhhhhhkkkkvvvvvvvvvvvvvvvvvvvvvvvkkkkhhhhhhhkk...........................',
    '.............................kkhhhhhhhkvvvvvvvvvvvvvvvvvvvvvvvvvvvkhhhhhhhkk............................',
    '..............................kkhhhhhhhvvvvvvvvvvvvvvvvvvvvvvvvvvvhhhhhhhkk.............................',
    '...............................kkhhhhhhvvvvvvvvvvvvvvvvvvvvvvvvvvvhhhhhhkk..............................',
    '................................kkkhhhhvvvvvvvvvvvvvvvvvvvvvvvvvvvhhhhkkk...............................',
    '................................kkkkkkkvvvvvvvvvvvvvvvvvvvvvvvvvmmkkkkkkk...............................',
    '.................kkk............kkkkkkkkkkkvvvvvvvvvvvvvvvvvvvkkkkkkkkkkk............kkk................',
    '.............kkkkknkkkkk.........kvvkeekkkkkkkkeeeekvvvvvvvkkkkkkkmmmmmk.........kkkkknkkkkk............',
    '...........kkknnnnnnnnnkkk......kkvvkepppkkkkkkkkkkkvvkkkkkkkkkmmmmmmmmkk......kkknnnnnnnnnkkk..........',
    '.........kkknnnnnnnnnnnnnkkk....kvvvkepppkvvvvkkkkkkvkkkkkkmmmmmmmmmmmmmk....kkknnnnnnnnnnnnnkkk........',
    '.....kkkkknnnnnnnnnnnnnnnnnkk...kvvvkeeeekvvvvkeeekkvvkvvmmmmmmmmmmmmmmmk...kknnnnnnnnnnnnnnnnnkkkkk....',
    '....kkukknnnnnnnnnnnnnnnnnnnkk..kvvvvvvvvvvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmk..kknnnnnnnnnnnnnnnnnnnkkukk...',
    '...kkuuunnnnnnnnnnnnnnnnnnnnnkkkkvvvvvvvvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmmmkkkknnnnnnnnnnnnnnnnnnnnnuuukk..',
    '...kuuuuunnnnnnnnnnnnnnnnnnnnnkkvvvvvvvvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmmmmmkknnnnnnnnnnnnnnnnnnnnnuuuuuk..',
    '...kkuuuunnnnnnnnnnnnnnnnnnnnnkkkvvvvvvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmmmmmkkknnnnnnnnnnnnnnnnnnnnnuuuukk..',
    '....kuuuuunnnnnnnnnnnnnnnnnnnnnkkvvvvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmmmmmuukknnnnnnnnnnnnnnnnnnnnnuuuuuk...',
    '....knuuuunnnnnnnnnnnnnnnnnnnnnnkvvvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmmmmmuuuknnnnnnnnnnnnnnnnnnnnnnuuuunk...',
    '...kknuuuunnnnnnnnnnnnnnnnnnnnnnkvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmmmmmuuuuuknnnnnnnnnnnnnnnnnnnnnnuuuunkk..',
    '...knnuuuuunnnnnnnnnnnnnnnnnnnnnnkvvvvvvvvvvvvmmmmmmummmmmmmmmmmmmuuuuuknnnnnnnnnnnnnnnnnnnnnnuuuuunnk..',
    '..kknnnuuuunnnnnnnnnnnnnnnnnnnnnnkvvvvvvvvvvmmmmuuuuuuuuummmmmmmmuuuuuuknnnnnnnnnnnnnnnnnnnnnnuuuunnnkk.',
    '..knnnnuuuuunnnnnnnnnnnnnnnnnnnnnnkvvvvvvvvmmmuuuuuuuuuuuuummmmuuuuuuuknnnnnnnnnnnnnnnnnnnnnnuuuuunnnnk.',
    '..knnnnnuuuunnnnnnnnnnnnnnnnvnnnnnkvvvvvvvktettttttkuuuuuuuuemuuuuuuuuknnnnnunnnnnnnnnnnnnnnnuuuunnnnnk.',
    '.kknnnnnuuuunnnnnnnnnnvvvvvvvvvvvvvkvvvvmmkteeettttkuuuuuuuueuuuuuuuukuuuuuuuuuuuuunnnnnnnnnnuuuunnnnnkk',
    '.knnnnnnnuuuunnnnnnnvvvvvvvvvvvvvvvvvvvmmmmketttttkuuuuuuuuueuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnuuuunnnnnnnk',
    '.knnnnnnnuuuunnnnnnvvvvvvvvvvvvvvvvvvmmmmmmmeuuuuuuuuuuuuuuueuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnuuuunnnnnnnk',
    'kknnnnnnnuuuuunnnvvvvvvvvvvvvvvvvvvvmmmmmmmmeuuuuuuuuuuuuuuueuuuuuuuuuuuuuuuuuuuuuuuuuuunnnuuuuunnnnnnnk',
    'knnnnnnnnnuuuunnvvvvvvvvvvvvvvvvvvmmmmmmmmmmemuuuuuuuuuuuuuueuuuuuuuuuuuuuuuuuuuuuuuuuuuunnuuuunnnnnnnnn',
    'knnnnnnnnnuuuuunvvvvvvvvvvvvvvvvvmmmmmmmmmmmemmmuuuuuuuuuuuueuuuuuuuuuuuuuuuuuuuuuuuuuuuunuuuuunnnnnnnnn',
    'knnnnnnnnnnuuuuvvvvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmmmmmuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnnnn',
    'knnnnnnnnnnuuuuvvvvvvvvvvvvvvvmmmmmmmmmmmmmmmmmmmmuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuunnnnnnnnnn',
    'knnnnnnnnnnnuuuvvvvvvmmmvvvvvmmmmmmmmmmmmmmmmmmmmuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuummmuuuuuuuuunnnnnnnnnnn',
    'knnnnnnnnnnnuuvvvvvvmmmmmvvmmmmmmmmmmmmmmmmmmmmuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuummmmmuuuuuuuunnnnnnnnnnn',
    'knnnnnnnnnnnuuuvvvvmmmmmmmmmmmmmmmmmmmmmmmmmmmuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuummmmmmmuuuuuuunnnnnnnnnnn',
    'knnnnnnnnnnnnuuvvvvmmmmmmmmmmmmmmmmmmmmmmmmmmuuuuuuuvuuuuuuuuuuuuuuuuuuuuuuuuuummmmmmmuuuuuunnnnnnnnnnnn',
    'knnnnnnnnnnnnuuvvvmmmmmmmmmmmmmmmmmmmmmmmmmuuuuuvvvvvvvvvuuuuuuuuuuuuuuuuuuuuuummmmmmmmuuuuunnnnnnnnnnnn',
    'nnnnnnnnnnnnnnuuvvmmmmmmmmmmmmmmmmmmmmmmmmuuuuvvvvvvvvvvvvvuuuuuuuuuuuuuuuuuuuuummmmmmmuuuunnnnnnnnnnnnn',
    'knnnnnnnnnnnnnuuvmmmmmmmmmmmmmmmmmmmmmmmuuuuvvvvvvvvvvvvvvvvvuuuuuuuuuuuuuuuuuuuummmmmmmuuunnnnnnnnnnnnn',
    'knnnnnnnnnnnnnuummmmmmmmmmmmmmmmmmmmmmmuuuuvvvvvvvvvvvvvvvvvvvuuuuuuuuuuuuuuuuuuummmmmmmmuunnnnnnnnnnnnn',
    'knnnnnnnnnnnnnnummmmmmmmmmmmmmmmmmmmmuuuuuvvvvvvvvvvvvvvvvvvvvvuuuuuuuuuuuuuuuuuuummmmmmmunnnnnnnnnnnnnn',
    'knnnnnnnnnnnnnnmmmmmmmmmmmmmmmmmmmmmuuuuuuvvuuuuuuuvvvuuuuuuuvvuuuuuuuuuuuuuuuuuuummmmmmmmnnnnnnnnnnnnnn',
    'knnnnnnnnnnnnnnmmmmmmmmmmmmmmmmmmmmuuuuuuvvvvvvvvvvvvvvvvvvvvvvvuuuuuuuuuuuuuuuuuuummmmmmmnnnnnnnnnnnnnn',
    'knnnnnnnnnnnnnmmmmmmmmnnnmmmmmmmmuuuuuuuvvvvvvvvvvvvqvvvvvvvvvvvvuuuuuuuuuuuuuuunnnmmmmmmmmnnnnnnnnnnnnn',
    'knnnnnnnnnnnnnmmmmmmmnnnnmmmmmmmuuuuuuuuvvvvvvvvvqqqqqqqvvvvvvvvvuuuuuuuuuuuuuuunnnnmmmmmmmnnnnnnnnnnnnn',
    'knnnnnnnnnnnnmmmmmmmunnnmmmmmmuuuuuuuuuuvvvvvvvvqqqqqqqqqvvvvvvvvuuuuuuuuuuuuuuuunnnummmmmmmnnnnnnnnnnnn',
    'knnnnnnnnnnnmmmmmmmmuunnnmmmmuuuuuuuuuuvvvvvvvvqqqqqqqqqqqvvvvvvvvuuuuuuuuuuuuuunnnuummmmmmmmnnnnnnnnnnn',
    'kknnnnnnnnnnmmmmmmmuuunnnmmuuuuuuuuuuuuvvvvvvvqqqqqqqqqqqqqvvvvvvvuuuuuuuuuuuuuunnnuuummmmmmmnnnnnnnnnnk',
    '.knnnnnnnnnmmmmmmmmuuuunnmuuuuuuuuuuuuuvvvvvvvqqqqqqqqqqqqqvvvvvvvuuuuuuuuuuuuuunnuuuummmmmmmmnnnnnnnnnk',
    '.knnnnnnnnnmmmmmmmnuuuunnuuuuuuuuuuuuuuvvvvvuuuuuuuqqquuuuuuuvvvvvuuuuuuuuuuuuuunnuuuunmmmmmmmnnnnnnnnnk',
    '.kknnnnnnnmmmmmmmnnuuuunnuuuuuuuuuuuuuuvvvvvvqqqqqqqqqqqqqqqvvvvvvuuuuuuuuuuuuuunnuuuunnmmmmmmmnnnnnnnkk',
    '..knnnnnnmmmmmmmmnnuuuuunuuuuuuuuuuuuuvvvvvvvqqqqqqqqqqqqqqqvvvvvvvuuuuuuuuuuuuunuuuuunnmmmmmmmmnnnnnnk.',
    'kkknnnnnnmmmmmmmnnnnuuuunnuuuuuuuuuuuuuvvvvvvqqqqqqqqqqqqqqqvvvvvvuuuuuuuuuuuuunnuuuunnnnmmmmmmmnnnnnnkk',
    'kqkknnnnmmmmmmmmnnnnuuuuunuuuuuuuuuuuuuvvvvvqqqqqqqqqqqqqqqqqvvvvvuuuuuuuuuuuuunuuuuunnnnmmmmmmmmnnnnkkq',
    'kqqknnnnmmmmmmmnnnnnnuuunnuuuuuuuuuuuuuvvvvvvqqqqqqqqqqqqqqqvvvvvvuuuuuuuuuuuuunnuuunnnnnnmmmmmmmnnnnkqq',
    'kkqqknnmmmmmmmmnnnnnnnunnnnuuuuuuuuuuuuvvvvvvqqqqqqqqqqqqqqqvvvvvvuuuuuuuuuuuunnnnunnnnnnnmmmmmmmmnnkqqk',
    'kkkqqnnmummmmmnnnnnnnnnnnnnuuuuuuuuuuuuvvvvvvqqqqqqqqqqqqqqqvvvvvvuuuuuuuuuuuunnnnnnnnnnnnnmmmmmmmnnqqkk',
    'kqkkquuuuuuumnnnnnnnnnnnnnnnuuuuuuuuuuuuvvvvuuuuuuuqqquuuuuuuvvvvuuuuuuuuuuuunnnnnnnnnnnnnnnmmmmmmmmqkkq',
    'kqqkuuuuuuuuunnnnnnnnnnnnnnnuuuuuuuuuuuuvvvvvvqqqqqqqqqqqqqvvvvvvuuuuuuuuuuuunnnnnnnnnnnnnnnmmmmmmmmmkqq',
    'kkqquuuuuuuuuunnnnnnnnnnnnnnnuuuuuuuuuuuvvvvvvqqqqqqqqqqqqqvvvvvvuuuuuuuuuuunnnnnnnnnnnnnnnmmmmmmmmmmqqk',
    'kkkqquuuuuuuuunnnnnnnnnnnnnnnkuuuuuuuuuuuvvvvvvqqqqqqqqqqqvvvvvvuuuuuuuuuuuknnnnnnnnnnnnnnnmmmmmmmmmqqkk',
    'kquuquuuuuuuuuunnnnnnnnnnnnnkkuuuuuuuuuuuuvvvvvvqqqqqqqqqvvvvvvuuuuuuuuuuuukknnnnnnnnnnnnnmmmmmmmmmmqmmq',
    'kqquuuuuuuuuuunnnnnnnnnnnnnkkkkuuuuuuuuuuuvvvvvvvqqqqqqqvvvvvvvuuuuuuuuuuukkkknnnnnnnnnnnnnmmmmmmmmmmmqq',
    'kkqquuuuuuuuuunnnnnnnnnnnkkk..kkuuuuuuuuuuuvvvvvvvvvqvvvvvvvvvuuuuuuuuuuukk..kkknnnnnnnnnnnmmmmmmmmmmqqk',
    '.kkqquuuuuuuuknnnnnnnnnkkk.....kkuuuuuuuuuuuvvvvvvvvvvvvvvvvvuuuuuuuuuuukk.....kkknnnnnnnnnkmmmmmmmmqqkk',
    '..kkquuuuuuukkkkkknkkkkk........kkkuuuuuuuuuuuvvvvvvvvvvvvvuuuuuuuuuuukkk........kkkkknkkkkkkmmmmmmmqkk.',
    '...kkkkkukkkk....kkk.............kkkuuuuuuuuuuuuvvvvvvvvvuuuuuuuuuuuukkk.............kkk....kkkkmkkkkk..',
    '.......kkk.......................kuuuuuuuuuuuuuuuuuuvuuuuummmmmmmmmmmmmk.......................kkk......',
    '.................................kuuuuuuuuuuuuuuuuuuuuuuuummmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuuuuuuuuuuuummmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuuuuuuuuuuuummmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuukkkkkukkkkkmmmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuk...kkk...kmmmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuk.........kmmmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuk.........kmmmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuk.........kmmmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuk.........kmmmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuk.........kmmmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuk.........kmmmmmmmmmmmmmk................................',
    '.................................kuuuuuuuuuuuuuk.........kmmmmmmmmmmmmmk................................',
    '.............................kkkkkuuuuuuuuuuuuukkkkk...kkkmmmmmmmmmmmmmkkkkkkk..........................',
    '.............................kuuuuuuuuuuuuuuuuuuuuuk...kmmmmmmmmmmmmmmmmmmmmmk..........................',
    '.............................kuuuuuuuuuuuuuuuuuuuuuk...kmmmmmmmmmmmmmmmmmmmmmk..........................',
    '.............................kuuuuuuuuuuuuuuuuuuuuuk...kmmmmmmmmmmmmmmmmmmmmmk..........................',
    '.............................kuuuuuuuuuuuuuuuuuuuuuk...kmmmmmmmmmmmmmmmmmmmmmk..........................',
    '.............................kuuuuuuuuuuuuuuuuuuuuuk...kmmmmmmmmmmmmmmmmmmmmmk..........................',
    '.............................kuuuuuuuuuuuuuuuuuuuuuk...kmmmmmmmmmmmmmmmmmmmmmk..........................',
    '.............................kuuquuuuuuuquuuuuuuquuk...kmmqmmmmmmmqmmmmmmmqmmk..........................',
    '.............................kkqkkkkkkkkqkkkkkkkkqkk...kkqkkkkkkkkqkkkkkkkkqkk..........................',
    '.............................kqkk......kqk......kkqk...kqkk......kqk......kkqk..........................',
    '.............................kkk.......kqk.......kkk...kkk.......kqk.......kkk..........................',
  ],
};

export const bone: Sprite = {
  w: 16,
  h: 8,
  rows: [
    '.kk..kk....kk..k',
    'kqqkkqqk..kqqkkq',
    'kqqqqqqkkkkqqqqk',
    '.kqqqqqqqqqqqqk.',
    '.kqqqqqqqqqqqqk.',
    'kqqqqqqkkkkqqqqk',
    'kqqkkqqk..kqqkkq',
    '.kk..kk....kk..k',
  ],
};

export const bang: Sprite = {
  w: 7,
  h: 10,
  rows: [
    '..kkk..',
    '.keeeek',
    '.keeeek',
    '..kek..',
    '..kek..',
    '..kek..',
    '.......',
    '..kek..',
    '.keeeek',
    '..kkk..',
  ],
};

export const finger: Sprite = {
  w: 14,
  h: 16,
  rows: [
    '......kk......',
    '.....keek.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '....kwwwk.....',
    '...kskwwwk....',
    '..ksskwwwwk...',
    '..ksskwwwwk...',
    '..ksskwwwk....',
    '...kskwwk.....',
    '....kkkk......',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
};

export interface BlitOptions {
  flipX?: boolean;
  alpha?: number;
  /** Replace palette keys. */
  recolor?: Record<string, string>;
  /** Flat color for every filled pixel. Used for hit flash. */
  tint?: string;
}

export function blit(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number,
  options?: BlitOptions,
): void {
  const alpha = options?.alpha ?? 1;
  if (alpha <= 0 || scale <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  const left = Math.round(x - (sprite.w * scale) / 2);
  const top = Math.round(y - sprite.h * scale);
  for (let row = 0; row < sprite.h; row += 1) {
    const line = sprite.rows[row] ?? '';
    for (let col = 0; col < sprite.w; col += 1) {
      const sourceCol = options?.flipX ? sprite.w - 1 - col : col;
      const key = line[sourceCol] ?? '.';
      if (key === '.' || key === ' ') continue;
      const color = options?.tint ?? options?.recolor?.[key] ?? palette[key];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(left + col * scale, top + row * scale, Math.ceil(scale), Math.ceil(scale));
    }
  }
  ctx.restore();
}

export interface Block {
  dx: number;
  dy: number;
  color: string;
  size: number;
}

/** Chunks of a sprite, centered, for the shatter. */
export function shatterBlocks(sprite: Sprite, cell = 3): Block[] {
  const blocks: Block[] = [];
  for (let y = 0; y < sprite.h; y += cell) {
    const line = sprite.rows[y] ?? '';
    for (let x = 0; x < sprite.w; x += cell) {
      const key = line[x] ?? '.';
      if (key === '.' || key === ' ') continue;
      const color = palette[key];
      if (!color) continue;
      blocks.push({
        dx: x - sprite.w / 2,
        dy: y - sprite.h / 2,
        color,
        size: cell,
      });
    }
  }
  return blocks;
}
