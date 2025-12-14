{
  description = "ESLint plugin to enforce FFI stub-only pattern for PureScript-JavaScript interop";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        packageJson = builtins.fromJSON (builtins.readFile ./package.json);

        eslint-plugin-ffi-stub = pkgs.stdenv.mkDerivation {
          pname = packageJson.name;
          version = packageJson.version;

          src = ./.;

          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp index.js $out/
            cp package.json $out/
            runHook postInstall
          '';

          meta = with pkgs.lib; {
            description = packageJson.description;
            homepage = packageJson.homepage;
            license = licenses.mit;
            maintainers = [ ];
          };
        };
      in
      {
        packages = {
          default = eslint-plugin-ffi-stub;
          inherit eslint-plugin-ffi-stub;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            nodePackages.eslint
          ];
        };
      }
    );
}
