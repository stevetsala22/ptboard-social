import {Composition} from 'remotion';
import {Reel} from './Reel';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/900.css';

export const Root = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={900} fps={30} width={1080} height={1920}
      defaultProps={{showSafe: false}} />
    <Composition id="Cover" component={Reel} durationInFrames={1} fps={30} width={1080} height={1920}
      defaultProps={{showSafe: false, cover: true}} />
  </>
);
