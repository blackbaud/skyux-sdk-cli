describe('sky-pages bin', () => {
  it('should call console.error', () => {
    spyOn(console, 'error');
    require('../bin/sky-pages');
    /* eslint-disable no-console */
    expect(console.error).toHaveBeenCalled();
  });
});
