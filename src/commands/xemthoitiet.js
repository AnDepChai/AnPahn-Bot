const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const weatherEmojis = {
    '01d': '☀️', '01n': '🌙', // Clear sky
    '02d': '🌤️', '02n': '☁️', // Few clouds
    '03d': '☁️', '03n': '☁️', // Scattered clouds
    '04d': '☁️', '04n': '☁️', // Broken clouds
    '09d': '🌧️', '09n': '🌧️', // Shower rain
    '10d': '🌦️', '10n': '🌧️', // Rain
    '11d': '⛈️', '11n': '⛈️', // Thunderstorm
    '13d': '🌨️', '13n': '🌨️', // Snow
    '50d': '🌫️', '50n': '🌫️'  // Mist
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xemthoitiet')
        .setDescription('xᴇᴍ ᴛʜôɴɢ ᴛɪɴ ᴛʜờɪ ᴛɪếᴛ.')
        .addStringOption(option =>
            option.setName('khu_vực_của_bạn')
                .setDescription('ᴋʜᴜ ᴠựᴄ ʙạɴ ᴍᴜốɴ xᴇᴍ ᴛʜờɪ ᴛɪếᴛ.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const city = interaction.options.getString('khu_vực_của_bạn');
        const apiKey = process.env.WEATHER_API_KEY;

        try {
            const response = await axios.get(
                `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=vi`
            );

            const weather = response.data;

            const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            const now = new Date();
            const dateStr = `${days[now.getDay()]} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

            const temp = Math.round(weather.main.temp);
            const feels_like = Math.round(weather.main.feels_like);
            const weatherIcon = weatherEmojis[weather.weather[0].icon] || '❓';

            const getTempStatus = (temp) => {
                if (temp <= 10) return '❄️ Rất Lạnh';
                if (temp <= 20) return '🌤️ Mát Mẻ';
                if (temp <= 30) return '☀️ Ấm Áp';
                return '🔥 Nóng Bức';
            };

            const windKmh = Math.round(weather.wind.speed * 3.6);
            const windGustKmh = weather.wind.gust ? Math.round(weather.wind.gust * 3.6) : null;

            const embed = new EmbedBuilder()
                .setColor(0x4ABDAC)
                .setTitle(`📍 Thời tiết tại ${weather.name}, ${weather.sys.country} (${dateStr})`)
                .setThumbnail(`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`)
                .addFields(
                    {
                        name: '🌡️ Nhiệt độ',
                        value: `\`${temp}°C\` - ${getTempStatus(temp)}\n💧 Cảm giác như: \`${feels_like}°C\``,
                        inline: true,
                    },
                    {
                        name: '💦 Độ ẩm & Áp suất',
                        value: `Độ ẩm: \`${weather.main.humidity}%\`\nÁp suất: \`${weather.main.pressure} hPa\``,
                        inline: true,
                    },
                    {
                        name: '🌫️ Tầm nhìn & Mây',
                        value: `Tầm nhìn: \`${(weather.visibility / 1000).toFixed(1)} km\`\nMây che phủ: \`${weather.clouds.all}%\``,
                        inline: true,
                    },
                    {
                        name: '💨 Gió',
                        value: `Tốc độ: \`${windKmh} km/h\`${windGustKmh ? `\nGió giật: \`${windGustKmh} km/h\`` : ''}\nHướng: \`${weather.wind.deg}°\``,
                        inline: true,
                    },
                    {
                        name: '🌅 Mặt trời',
                        value: `Mọc: <t:${weather.sys.sunrise}:t>\nLặn: <t:${weather.sys.sunset}:t>`,
                        inline: true,
                    },
                    {
                        name: '📌 Trạng thái thời tiết',
                        value: `${weatherIcon} ${weather.weather[0].description}`,
                        inline: true,
                    },
                )
                .setFooter({
                    text: `© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧`,
                })
                .setThumbnail(`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('❌ Không tìm thấy thông tin thời tiết cho thành phố này!');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};