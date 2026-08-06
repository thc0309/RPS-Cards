import type { ImageSourcePropType } from 'react-native';
import village from '../assets/folk_default/backgrounds/village-courtyard.png';
import paper from '../assets/folk_default/backgrounds/paper-texture.png';
import logo from '../assets/folk_default/controls/logo.png';
import redButton from '../assets/folk_default/controls/button-red.png';
import blueButton from '../assets/folk_default/controls/button-blue.png';
import redPlaque from '../assets/folk_default/controls/plaque-red.png';
import bluePlaque from '../assets/folk_default/controls/plaque-blue.png';
import bot from '../assets/folk_default/icons/bot.png';
import joinDoor from '../assets/folk_default/icons/join-door.png';
import plus from '../assets/folk_default/icons/plus.png';
import home from '../assets/folk_default/icons/home.png';
import copy from '../assets/folk_default/feedback/copy.png';
import cardBack from '../assets/folk_default/cards/card-back.png';
import cardFrame from '../assets/folk_default/cards/card-frame.png';
import paperHand from '../assets/folk_default/cards/paper-hand.png';
import rockFist from '../assets/folk_default/cards/rock-fist.png';
import scissors from '../assets/folk_default/cards/scissors.png';
import scrollPanel from '../assets/folk_default/board/scroll-panel.png';
import timerBadge from '../assets/folk_default/board/timer-badge.png';
import vsMedallion from '../assets/folk_default/board/vs-medallion.png';
import scoreBlue from '../assets/folk_default/board/score-blue.png';
import scoreRed from '../assets/folk_default/board/score-red.png';
import festivalDrum from '../assets/folk_default/decorations/festival-drum.png';
import festivalFlag from '../assets/folk_default/decorations/festival-flag.png';
import lionDance from '../assets/folk_default/decorations/lion-dance.png';

export const folkAssets = {
  backgrounds: {
    village: village as ImageSourcePropType,
    paper: paper as ImageSourcePropType,
  },
  controls: {
    logo: logo as ImageSourcePropType,
    redButton: redButton as ImageSourcePropType,
    blueButton: blueButton as ImageSourcePropType,
    redPlaque: redPlaque as ImageSourcePropType,
    bluePlaque: bluePlaque as ImageSourcePropType,
  },
  icons: {
    bot: bot as ImageSourcePropType,
    joinDoor: joinDoor as ImageSourcePropType,
    plus: plus as ImageSourcePropType,
    home: home as ImageSourcePropType,
    copy: copy as ImageSourcePropType,
  },
  cards: {
    back: cardBack as ImageSourcePropType,
    frame: cardFrame as ImageSourcePropType,
    paper: paperHand as ImageSourcePropType,
    rock: rockFist as ImageSourcePropType,
    scissors: scissors as ImageSourcePropType,
  },
  board: {
    scrollPanel: scrollPanel as ImageSourcePropType,
    timerBadge: timerBadge as ImageSourcePropType,
    vs: vsMedallion as ImageSourcePropType,
    scoreBlue: scoreBlue as ImageSourcePropType,
    scoreRed: scoreRed as ImageSourcePropType,
  },
  decorations: {
    drum: festivalDrum as ImageSourcePropType,
    flag: festivalFlag as ImageSourcePropType,
    lion: lionDance as ImageSourcePropType,
  },
} as const;
