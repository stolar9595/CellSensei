{pkgs}: {
  deps = [
    pkgs.haskellPackages.gen-passwd
    pkgs.emacs27Packages.json-navigator
    pkgs.vimPlugins.vim-dadbod-completion
    pkgs.rPackages.bfw
    pkgs.rPackages.gamlss_data
    pkgs.rPackages.d3Network
    pkgs.libint
    pkgs.python39Packages.pysma
    pkgs.haskellPackages.network-data
  ];
}
