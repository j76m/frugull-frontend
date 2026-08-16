import logo from '../assets/frugull-logo.png';

export default function Wordmark({ className = 'h-10' }) {
  return <img src={logo} alt="Frugull" className={`${className} w-auto`} />;
}
