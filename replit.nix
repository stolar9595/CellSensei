{pkgs}: {
  deps = [
    pkgs.python311Packages.ipyxact
    pkgs.rPackages.test3probe
    pkgs.python312Packages.graphite-web
  ];
}
