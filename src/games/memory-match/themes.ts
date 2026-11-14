import { assetUrl } from '../../utils/assets';

export type ThemeId =
  | 'lion-king'
  | 'kung-fu-panda'
  | 'paw-patrol'
  | 'toy-story'
  | 'cars'
  | 'tom-and-jerry'
  | 'sports'
  | 'fruits'
  | 'vegetables'
  | 'car-logos';

export type ThemeCategory = 'stories' | 'world';

export type BoardSizeId = '4x5' | '4x4' | '5x6';

export interface CharacterCardSpec {
  pairId: string;
  label: string;
  imagePath: string;
}

export interface ThemeSpec {
  id: ThemeId;
  category: ThemeCategory;
  title: string;
  subtitle: string;
  accentColor: string;
  previewPaths: [string, string];
  characters: CharacterCardSpec[];
}

export interface BoardSizeSpec {
  id: BoardSizeId;
  label: string;
  description: string;
  cols: number;
  rows: number;
  cardsCount: number;
  pairs: number;
  isDefault?: boolean;
}

export const DEFAULT_THEME_ID: ThemeId = 'lion-king';
export const DEFAULT_BOARD_SIZE_ID: BoardSizeId = '4x5';

/**
 * Default board layout is 4x5 (4 columns across x 5 rows vertically = 20 cards / 10 pairs).
 */
export const BOARD_SIZES: readonly BoardSizeSpec[] = [
  {
    id: '4x5',
    label: '4 × 5',
    description: '5 vertically • 20 cards',
    cols: 4,
    rows: 5,
    cardsCount: 20,
    pairs: 10,
    isDefault: true,
  },
  {
    id: '4x4',
    label: '4 × 4',
    description: '16 cards • Quick game',
    cols: 4,
    rows: 4,
    cardsCount: 16,
    pairs: 8,
  },
  {
    id: '5x6',
    label: '5 × 6',
    description: '30 cards • Big challenge',
    cols: 5,
    rows: 6,
    cardsCount: 30,
    pairs: 15,
  },
];

export const CARD_THEMES: readonly ThemeSpec[] = [
  {
    id: 'lion-king',
    category: 'stories',
    title: 'Lion King',
    subtitle: 'Pride Lands friends',
    accentColor: '#F2B84B',
    previewPaths: ['themes/lion-king/01-simba.png', 'themes/lion-king/04-timon.png'],
    characters: [
      { pairId: 'lk-01', label: 'Simba', imagePath: 'themes/lion-king/01-simba.png' },
      { pairId: 'lk-02', label: 'Mufasa', imagePath: 'themes/lion-king/02-mufasa.png' },
      { pairId: 'lk-03', label: 'Nala', imagePath: 'themes/lion-king/03-nala.png' },
      { pairId: 'lk-04', label: 'Timon', imagePath: 'themes/lion-king/04-timon.png' },
      { pairId: 'lk-05', label: 'Pumbaa', imagePath: 'themes/lion-king/05-pumbaa.png' },
      { pairId: 'lk-06', label: 'Rafiki', imagePath: 'themes/lion-king/06-rafiki.png' },
      { pairId: 'lk-07', label: 'Zazu', imagePath: 'themes/lion-king/07-zazu.png' },
      { pairId: 'lk-08', label: 'Baby Elephant', imagePath: 'themes/lion-king/08-baby-elephant.png' },
      { pairId: 'lk-09', label: 'Cheetah', imagePath: 'themes/lion-king/09-cheetah.png' },
      { pairId: 'lk-10', label: 'Giraffe', imagePath: 'themes/lion-king/10-giraffe.png' },
      { pairId: 'lk-11', label: 'Zebra', imagePath: 'themes/lion-king/11-zebra.png' },
      { pairId: 'lk-12', label: 'Hyena', imagePath: 'themes/lion-king/12-hyena.png' },
      { pairId: 'lk-13', label: 'Hippo', imagePath: 'themes/lion-king/13-hippo.png' },
      { pairId: 'lk-14', label: 'Rhino', imagePath: 'themes/lion-king/14-rhino.png' },
      { pairId: 'lk-15', label: 'Crane', imagePath: 'themes/lion-king/15-crane.png' },
      { pairId: 'lk-16', label: 'Chameleon', imagePath: 'themes/lion-king/16-chameleon.png' },
    ],
  },
  {
    id: 'kung-fu-panda',
    category: 'stories',
    title: 'Kung Fu Panda',
    subtitle: 'Valley of Peace heroes',
    accentColor: '#3BA99C',
    previewPaths: ['themes/kung-fu-panda/01-po.png', 'themes/kung-fu-panda/02-tigress.png'],
    characters: [
      { pairId: 'kfp-01', label: 'Po', imagePath: 'themes/kung-fu-panda/01-po.png' },
      { pairId: 'kfp-02', label: 'Tigress', imagePath: 'themes/kung-fu-panda/02-tigress.png' },
      { pairId: 'kfp-03', label: 'Master Shifu', imagePath: 'themes/kung-fu-panda/03-shifu.png' },
      { pairId: 'kfp-04', label: 'Master Oogway', imagePath: 'themes/kung-fu-panda/04-oogway.png' },
      { pairId: 'kfp-05', label: 'Monkey', imagePath: 'themes/kung-fu-panda/05-monkey.png' },
      { pairId: 'kfp-06', label: 'Mantis', imagePath: 'themes/kung-fu-panda/06-mantis.png' },
      { pairId: 'kfp-07', label: 'Crane', imagePath: 'themes/kung-fu-panda/07-crane.png' },
      { pairId: 'kfp-08', label: 'Viper', imagePath: 'themes/kung-fu-panda/08-viper.png' },
      { pairId: 'kfp-09', label: 'Mr. Ping', imagePath: 'themes/kung-fu-panda/09-mr-ping.png' },
      { pairId: 'kfp-10', label: 'Tai Lung', imagePath: 'themes/kung-fu-panda/10-tai-lung.png' },
      { pairId: 'kfp-11', label: 'Master Ox', imagePath: 'themes/kung-fu-panda/11-master-ox.png' },
      { pairId: 'kfp-12', label: 'Master Croc', imagePath: 'themes/kung-fu-panda/12-master-croc.png' },
      { pairId: 'kfp-13', label: 'Lord Shen', imagePath: 'themes/kung-fu-panda/13-lord-shen.png' },
      { pairId: 'kfp-14', label: 'Master Ram', imagePath: 'themes/kung-fu-panda/14-master-ram.png' },
      { pairId: 'kfp-15', label: 'Baby Panda', imagePath: 'themes/kung-fu-panda/15-baby-panda.png' },
      { pairId: 'kfp-16', label: 'Bunny Villager', imagePath: 'themes/kung-fu-panda/16-bunny.png' },
    ],
  },
  {
    id: 'paw-patrol',
    category: 'stories',
    title: 'PAW Patrol',
    subtitle: 'Adventure Bay pups',
    accentColor: '#5B5BD6',
    previewPaths: ['themes/paw-patrol/01-chase.png', 'themes/paw-patrol/03-skye.png'],
    characters: [
      { pairId: 'pp-01', label: 'Chase', imagePath: 'themes/paw-patrol/01-chase.png' },
      { pairId: 'pp-02', label: 'Marshall', imagePath: 'themes/paw-patrol/02-marshall.png' },
      { pairId: 'pp-03', label: 'Skye', imagePath: 'themes/paw-patrol/03-skye.png' },
      { pairId: 'pp-04', label: 'Rubble', imagePath: 'themes/paw-patrol/04-rubble.png' },
      { pairId: 'pp-05', label: 'Rocky', imagePath: 'themes/paw-patrol/05-rocky.png' },
      { pairId: 'pp-06', label: 'Zuma', imagePath: 'themes/paw-patrol/06-zuma.png' },
      { pairId: 'pp-07', label: 'Everest', imagePath: 'themes/paw-patrol/07-everest.png' },
      { pairId: 'pp-08', label: 'Tracker', imagePath: 'themes/paw-patrol/08-tracker.png' },
      { pairId: 'pp-09', label: 'Bernie', imagePath: 'themes/paw-patrol/09-bernie.png' },
      { pairId: 'pp-10', label: 'Liberty', imagePath: 'themes/paw-patrol/10-liberty.png' },
      { pairId: 'pp-11', label: 'Sea Beagle', imagePath: 'themes/paw-patrol/11-sea-beagle.png' },
      { pairId: 'pp-12', label: 'Space Corgi', imagePath: 'themes/paw-patrol/12-space-corgi.png' },
      { pairId: 'pp-13', label: 'Medic Retriever', imagePath: 'themes/paw-patrol/13-medic-retriever.png' },
      { pairId: 'pp-14', label: 'Safety Collie', imagePath: 'themes/paw-patrol/14-safety-collie.png' },
      { pairId: 'pp-15', label: 'Robo Dog', imagePath: 'themes/paw-patrol/15-robo-dog.png' },
      { pairId: 'pp-16', label: 'Ranger Basset', imagePath: 'themes/paw-patrol/16-ranger-basset.png' },
    ],
  },
  {
    id: 'toy-story',
    category: 'stories',
    title: 'Toy Story',
    subtitle: 'Playroom pals',
    accentColor: '#F27A5E',
    previewPaths: ['themes/toy-story/01-woody.png', 'themes/toy-story/02-buzz.png'],
    characters: [
      { pairId: 'ts-01', label: 'Woody', imagePath: 'themes/toy-story/01-woody.png' },
      { pairId: 'ts-02', label: 'Buzz', imagePath: 'themes/toy-story/02-buzz.png' },
      { pairId: 'ts-03', label: 'Jessie', imagePath: 'themes/toy-story/03-jessie.png' },
      { pairId: 'ts-04', label: 'Rex', imagePath: 'themes/toy-story/04-rex.png' },
      { pairId: 'ts-05', label: 'Hamm', imagePath: 'themes/toy-story/05-hamm.png' },
      { pairId: 'ts-06', label: 'Slinky Dog', imagePath: 'themes/toy-story/06-slinky-dog.png' },
      { pairId: 'ts-07', label: 'Bullseye', imagePath: 'themes/toy-story/07-bullseye.png' },
      { pairId: 'ts-08', label: 'Space Alien', imagePath: 'themes/toy-story/08-alien.png' },
      { pairId: 'ts-09', label: 'Potato Pal', imagePath: 'themes/toy-story/09-potato-pal.png' },
      { pairId: 'ts-10', label: 'Bo Peep', imagePath: 'themes/toy-story/10-bo-peep.png' },
      { pairId: 'ts-11', label: 'Craft Buddy', imagePath: 'themes/toy-story/11-forky.png' },
      { pairId: 'ts-12', label: 'Lotso', imagePath: 'themes/toy-story/12-lotso.png' },
      { pairId: 'ts-13', label: 'Buttercup', imagePath: 'themes/toy-story/13-buttercup.png' },
      { pairId: 'ts-14', label: 'Triceratops', imagePath: 'themes/toy-story/14-triceratops.png' },
      { pairId: 'ts-15', label: 'Wheezy', imagePath: 'themes/toy-story/15-wheezy.png' },
      { pairId: 'ts-16', label: 'RC Buggy', imagePath: 'themes/toy-story/16-rc-buggy.png' },
    ],
  },
  {
    id: 'cars',
    category: 'stories',
    title: 'Cars',
    subtitle: 'Radiator Springs racers',
    accentColor: '#E14D43',
    previewPaths: ['themes/cars/01-mcqueen.png', 'themes/cars/04-mater.png'],
    characters: [
      { pairId: 'cars-01', label: 'Lightning McQueen', imagePath: 'themes/cars/01-mcqueen.png' },
      { pairId: 'cars-02', label: 'Jackson Storm', imagePath: 'themes/cars/02-jackson-storm.png' },
      { pairId: 'cars-03', label: 'Doc Hudson', imagePath: 'themes/cars/03-hudson.png' },
      { pairId: 'cars-04', label: 'Mater', imagePath: 'themes/cars/04-mater.png' },
      { pairId: 'cars-05', label: 'Sally', imagePath: 'themes/cars/05-sally.png' },
      { pairId: 'cars-06', label: 'Cruz Ramirez', imagePath: 'themes/cars/06-cruz-ramirez.png' },
      { pairId: 'cars-07', label: 'Luigi', imagePath: 'themes/cars/07-luigi.png' },
      { pairId: 'cars-08', label: 'Guido', imagePath: 'themes/cars/08-guido.png' },
      { pairId: 'cars-09', label: 'Ramone', imagePath: 'themes/cars/09-ramone.png' },
      { pairId: 'cars-10', label: 'Flo', imagePath: 'themes/cars/10-flo.png' },
      { pairId: 'cars-11', label: 'Sheriff', imagePath: 'themes/cars/11-sheriff.png' },
      { pairId: 'cars-12', label: 'Fillmore', imagePath: 'themes/cars/12-fillmore.png' },
      { pairId: 'cars-13', label: 'Mack', imagePath: 'themes/cars/13-mack.png' },
      { pairId: 'cars-14', label: 'Red', imagePath: 'themes/cars/14-red.png' },
      { pairId: 'cars-15', label: 'The King', imagePath: 'themes/cars/15-the-king.png' },
      { pairId: 'cars-16', label: 'Chick Hicks', imagePath: 'themes/cars/16-chick-hicks.png' },
    ],
  },
  {
    id: 'tom-and-jerry',
    category: 'stories',
    title: 'Tom & Jerry',
    subtitle: 'Classic chase pals',
    accentColor: '#5B7AB8',
    previewPaths: ['themes/tom-and-jerry/01-tom.png', 'themes/tom-and-jerry/02-jerry.png'],
    characters: [
      { pairId: 'tj-01', label: 'Tom', imagePath: 'themes/tom-and-jerry/01-tom.png' },
      { pairId: 'tj-02', label: 'Jerry', imagePath: 'themes/tom-and-jerry/02-jerry.png' },
      { pairId: 'tj-03', label: 'Spike', imagePath: 'themes/tom-and-jerry/03-spike.png' },
      { pairId: 'tj-04', label: 'Tyke', imagePath: 'themes/tom-and-jerry/04-tyke.png' },
      { pairId: 'tj-05', label: 'Tuffy', imagePath: 'themes/tom-and-jerry/05-tuffy.png' },
      { pairId: 'tj-06', label: 'Butch', imagePath: 'themes/tom-and-jerry/06-butch.png' },
      { pairId: 'tj-07', label: 'Quacker', imagePath: 'themes/tom-and-jerry/07-quacker.png' },
      { pairId: 'tj-08', label: 'Toodles', imagePath: 'themes/tom-and-jerry/08-toodles.png' },
      { pairId: 'tj-09', label: 'Uncle Pecos', imagePath: 'themes/tom-and-jerry/09-uncle-pecos.png' },
      { pairId: 'tj-10', label: 'Lightning Cat', imagePath: 'themes/tom-and-jerry/10-lightning-cat.png' },
      { pairId: 'tj-11', label: 'Topsy', imagePath: 'themes/tom-and-jerry/11-topsy.png' },
      { pairId: 'tj-12', label: 'Droopy', imagePath: 'themes/tom-and-jerry/12-droopy.png' },
      { pairId: 'tj-13', label: 'Canary', imagePath: 'themes/tom-and-jerry/13-canary.png' },
      { pairId: 'tj-14', label: 'Goldfish', imagePath: 'themes/tom-and-jerry/14-goldfish.png' },
      { pairId: 'tj-15', label: 'Woodpecker', imagePath: 'themes/tom-and-jerry/15-baby-woodpecker.png' },
      { pairId: 'tj-16', label: 'Little Elephant', imagePath: 'themes/tom-and-jerry/16-little-elephant.png' },
    ],
  },
  {
    id: 'sports',
    category: 'world',
    title: 'Sports',
    subtitle: 'Active games & gear',
    accentColor: '#3BA99C',
    previewPaths: ['themes/sports/01-football.png', 'themes/sports/02-cricket.png'],
    characters: [
      { pairId: 'sp-01', label: 'Football', imagePath: 'themes/sports/01-football.png' },
      { pairId: 'sp-02', label: 'Cricket', imagePath: 'themes/sports/02-cricket.png' },
      { pairId: 'sp-03', label: 'Basketball', imagePath: 'themes/sports/03-basketball.png' },
      { pairId: 'sp-04', label: 'Tennis', imagePath: 'themes/sports/04-tennis.png' },
      { pairId: 'sp-05', label: 'Badminton', imagePath: 'themes/sports/05-badminton.png' },
      { pairId: 'sp-06', label: 'Baseball', imagePath: 'themes/sports/06-baseball.png' },
      { pairId: 'sp-07', label: 'Rugby', imagePath: 'themes/sports/07-rugby.png' },
      { pairId: 'sp-08', label: 'Table Tennis', imagePath: 'themes/sports/08-table-tennis.png' },
      { pairId: 'sp-09', label: 'Volleyball', imagePath: 'themes/sports/09-volleyball.png' },
      { pairId: 'sp-10', label: 'Golf', imagePath: 'themes/sports/10-golf.png' },
      { pairId: 'sp-11', label: 'Field Hockey', imagePath: 'themes/sports/11-field-hockey.png' },
      { pairId: 'sp-12', label: 'Archery', imagePath: 'themes/sports/12-archery.png' },
      { pairId: 'sp-13', label: 'Boxing', imagePath: 'themes/sports/13-boxing.png' },
      { pairId: 'sp-14', label: 'Bowling', imagePath: 'themes/sports/14-bowling.png' },
      { pairId: 'sp-15', label: 'Skateboarding', imagePath: 'themes/sports/15-skateboarding.png' },
      { pairId: 'sp-16', label: 'Cycling', imagePath: 'themes/sports/16-cycling.png' },
    ],
  },
  {
    id: 'fruits',
    category: 'world',
    title: 'Fruits',
    subtitle: 'Orchard favorites',
    accentColor: '#F27A5E',
    previewPaths: ['themes/fruits/01-apple.png', 'themes/fruits/06-watermelon.png'],
    characters: [
      { pairId: 'fr-01', label: 'Apple', imagePath: 'themes/fruits/01-apple.png' },
      { pairId: 'fr-02', label: 'Banana', imagePath: 'themes/fruits/02-banana.png' },
      { pairId: 'fr-03', label: 'Mango', imagePath: 'themes/fruits/03-mango.png' },
      { pairId: 'fr-04', label: 'Strawberry', imagePath: 'themes/fruits/04-strawberry.png' },
      { pairId: 'fr-05', label: 'Orange', imagePath: 'themes/fruits/05-orange.png' },
      { pairId: 'fr-06', label: 'Watermelon', imagePath: 'themes/fruits/06-watermelon.png' },
      { pairId: 'fr-07', label: 'Pineapple', imagePath: 'themes/fruits/07-pineapple.png' },
      { pairId: 'fr-08', label: 'Grapes', imagePath: 'themes/fruits/08-grapes.png' },
      { pairId: 'fr-09', label: 'Cherries', imagePath: 'themes/fruits/09-cherries.png' },
      { pairId: 'fr-10', label: 'Pear', imagePath: 'themes/fruits/10-pear.png' },
      { pairId: 'fr-11', label: 'Peach', imagePath: 'themes/fruits/11-peach.png' },
      { pairId: 'fr-12', label: 'Kiwi', imagePath: 'themes/fruits/12-kiwi.png' },
      { pairId: 'fr-13', label: 'Pomegranate', imagePath: 'themes/fruits/13-pomegranate.png' },
      { pairId: 'fr-14', label: 'Papaya', imagePath: 'themes/fruits/14-papaya.png' },
      { pairId: 'fr-15', label: 'Blueberries', imagePath: 'themes/fruits/15-blueberries.png' },
      { pairId: 'fr-16', label: 'Dragon Fruit', imagePath: 'themes/fruits/16-dragon-fruit.png' },
    ],
  },
  {
    id: 'vegetables',
    category: 'world',
    title: 'Vegetables',
    subtitle: 'Garden harvest',
    accentColor: '#56A35B',
    previewPaths: ['themes/vegetables/01-carrot.png', 'themes/vegetables/02-broccoli.png'],
    characters: [
      { pairId: 'vg-01', label: 'Carrot', imagePath: 'themes/vegetables/01-carrot.png' },
      { pairId: 'vg-02', label: 'Broccoli', imagePath: 'themes/vegetables/02-broccoli.png' },
      { pairId: 'vg-03', label: 'Tomato', imagePath: 'themes/vegetables/03-tomato.png' },
      { pairId: 'vg-04', label: 'Sweet Corn', imagePath: 'themes/vegetables/04-corn.png' },
      { pairId: 'vg-05', label: 'Bell Pepper', imagePath: 'themes/vegetables/05-bell-pepper.png' },
      { pairId: 'vg-06', label: 'Eggplant', imagePath: 'themes/vegetables/06-eggplant.png' },
      { pairId: 'vg-07', label: 'Green Peas', imagePath: 'themes/vegetables/07-green-peas.png' },
      { pairId: 'vg-08', label: 'Pumpkin', imagePath: 'themes/vegetables/08-pumpkin.png' },
      { pairId: 'vg-09', label: 'Potato', imagePath: 'themes/vegetables/09-potato.png' },
      { pairId: 'vg-10', label: 'Onion', imagePath: 'themes/vegetables/10-onion.png' },
      { pairId: 'vg-11', label: 'Cauliflower', imagePath: 'themes/vegetables/11-cauliflower.png' },
      { pairId: 'vg-12', label: 'Cucumber', imagePath: 'themes/vegetables/12-cucumber.png' },
      { pairId: 'vg-13', label: 'Radish', imagePath: 'themes/vegetables/13-radish.png' },
      { pairId: 'vg-14', label: 'Mushroom', imagePath: 'themes/vegetables/14-mushroom.png' },
      { pairId: 'vg-15', label: 'Beetroot', imagePath: 'themes/vegetables/15-beetroot.png' },
      { pairId: 'vg-16', label: 'Cabbage', imagePath: 'themes/vegetables/16-cabbage.png' },
    ],
  },
  {
    id: 'car-logos',
    category: 'world',
    title: 'Car Logos',
    subtitle: 'Famous auto badges',
    accentColor: '#5B5BD6',
    previewPaths: ['themes/car-logos/01-audi.png', 'themes/car-logos/11-ferrari.png'],
    characters: [
      { pairId: 'cl-01', label: 'Audi', imagePath: 'themes/car-logos/01-audi.png' },
      { pairId: 'cl-02', label: 'Mercedes', imagePath: 'themes/car-logos/02-mercedes.png' },
      { pairId: 'cl-03', label: 'BMW', imagePath: 'themes/car-logos/03-bmw.png' },
      { pairId: 'cl-04', label: 'Toyota', imagePath: 'themes/car-logos/04-toyota.png' },
      { pairId: 'cl-05', label: 'Tesla', imagePath: 'themes/car-logos/05-tesla.png' },
      { pairId: 'cl-06', label: 'Volkswagen', imagePath: 'themes/car-logos/06-volkswagen.png' },
      { pairId: 'cl-07', label: 'Chevrolet', imagePath: 'themes/car-logos/07-chevrolet.png' },
      { pairId: 'cl-08', label: 'Hyundai', imagePath: 'themes/car-logos/08-hyundai.png' },
      { pairId: 'cl-09', label: 'Renault', imagePath: 'themes/car-logos/09-renault.png' },
      { pairId: 'cl-10', label: 'Mitsubishi', imagePath: 'themes/car-logos/10-mitsubishi.png' },
      { pairId: 'cl-11', label: 'Ferrari', imagePath: 'themes/car-logos/11-ferrari.png' },
      { pairId: 'cl-12', label: 'Lamborghini', imagePath: 'themes/car-logos/12-lamborghini.png' },
      { pairId: 'cl-13', label: 'Jaguar', imagePath: 'themes/car-logos/13-jaguar.png' },
      { pairId: 'cl-14', label: 'Maserati', imagePath: 'themes/car-logos/14-maserati.png' },
      { pairId: 'cl-15', label: 'Bentley', imagePath: 'themes/car-logos/15-bentley.png' },
      { pairId: 'cl-16', label: 'Suzuki', imagePath: 'themes/car-logos/16-suzuki.png' },
    ],
  },
];

export interface DeckCard {
  uid: string;
  pairId: string;
  label: string;
  imageSrc: string;
}

function getRandomInt(maxExclusive: number): number {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function shuffleList<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getThemeSpec(themeId: ThemeId): ThemeSpec {
  return CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];
}

export function getBoardSizeSpec(boardSizeId: BoardSizeId): BoardSizeSpec {
  return BOARD_SIZES.find((b) => b.id === boardSizeId) ?? BOARD_SIZES[0];
}

export function buildDeck(themeId: ThemeId, boardSizeId: BoardSizeId): DeckCard[] {
  const theme = getThemeSpec(themeId);
  const size = getBoardSizeSpec(boardSizeId);
  const chosenCharacters = shuffleList(theme.characters).slice(0, size.pairs);

  const pairs: DeckCard[] = chosenCharacters.flatMap((character) => {
    const src = assetUrl(character.imagePath);
    return [
      { uid: `${character.pairId}-a`, pairId: character.pairId, label: character.label, imageSrc: src },
      { uid: `${character.pairId}-b`, pairId: character.pairId, label: character.label, imageSrc: src },
    ];
  });

  return shuffleList(pairs);
}
