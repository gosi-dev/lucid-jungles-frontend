// components/SearchBar.jsx
export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange = () => {},
  onKeyPress = () => {},
  onFocus = () => {},
  onBlur = () => {},
  className = "",
  style = {}
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') onKeyPress(e);
  };

  return (
    <div
      className={`absolute left-1/2 transform -translate-x-1/2 w-full z-50 flex flex-col items-center ${className}`}
      style={{
        paddingRight: "20px",
        paddingLeft: "20px",
        height: "60px",
        top: "30px",
        ...style,
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        onFocus={onFocus}
        onBlur={onBlur}
        className="focus:outline-none focus:ring focus:border-[#ABD49E] text-black text-sm"
        style={{
          width: "100%",
          height: "40px",
          backgroundColor: "#ABD49E",
          paddingLeft: "12px",
          paddingRight: "12px",
          marginTop: "10px",
        }}
      />
    </div>
  );
}
