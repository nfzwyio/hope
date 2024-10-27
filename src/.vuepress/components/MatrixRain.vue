<template>
    <div class="matrix-rain-container">
      <canvas ref="canvas" id="canvas"></canvas>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        canvas: null,
        ctx: null
      };
    },
    mounted() {
      this.canvas = this.$refs.canvas;
      this.ctx = this.canvas.getContext('2d');
  
      const screen = window.screen;
      this.canvas.width = screen.width;
      this.canvas.height = screen.height;
  
      const letters = Array.from({ length: Math.floor(screen.width / 10)}, () => 0);
  
      const designMatrix = () => {
        this.ctx.fillStyle = "rgba(0,0,0,.05)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
        this.ctx.fillStyle = "#0F0";
        letters.forEach((position_y, index) => {
          const text = String.fromCharCode(48 + Math.random() * 33);
          const position_x = index * 10;
          this.ctx.fillText(text, position_x, position_y);
  
          letters[index] = position_y > this.canvas.height + Math.random() * 1e4 ? 0 : position_y + 10;
        });
      };
  
      setInterval(designMatrix, 60);
    },
  };
  </script>
  
  <style scoped>
  .matrix-rain-container {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  canvas {
    display: flex;
    margin: 0 auto;
    width: 100%;
    height: 100vh;
  }
  </style>