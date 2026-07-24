module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies['sharp']) {
        pkg.dependencies['sharp'] = '^0.35.0';
      }
      if (pkg.dependencies && pkg.dependencies['postcss']) {
        pkg.dependencies['postcss'] = '^8.5.12';
      }
      if (pkg.dependencies && pkg.dependencies['lodash-es']) {
        pkg.dependencies['lodash-es'] = '^4.17.23';
      }
      return pkg;
    }
  }
};
