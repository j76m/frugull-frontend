import closedImg from '../assets/seagull.png';
import openImg from '../assets/seagull-open.png';

// isOpen is controlled from outside: pass true when a deal is selected/active
// on the map, false otherwise. The old app opened his eyes/beak on deal-click,
// so once the real map + deal markers exist (step 3), wire isOpen to
// "a deal is currently selected" state.
export default function SeagullMascot({ isOpen = false, className = 'w-16 h-16', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} transition-transform active:scale-90`}
      aria-label="Frugull mascot"
    >
      <img
        src={isOpen ? openImg : closedImg}
        alt=""
        className="w-full h-full object-contain"
        draggable={false}
      />
    </button>
  );
}
