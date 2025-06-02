import React from "react";

const Footer: React.FC = () => (
  <footer className="text-center py-6 border-t border-slate-700">
    <p className="text-sm text-slate-400">
      <a href="#">Tuition Escrow dApp</a> &copy; {new Date().getFullYear()} – Built with ❤️ by{" "}
      <a href="https://ramadhvni.com/" target="_blank">
        Rama
      </a>
      .
    </p>
  </footer>
);

export default Footer;
