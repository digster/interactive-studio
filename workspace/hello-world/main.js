let count = 0;
const btn = document.getElementById('counter-btn');

btn.addEventListener('click', () => {
  count++;
  btn.textContent = `Count: ${count}`;
  console.log(`Counter: ${count}`);
});

console.log('Hello from Interactive Studio!');
