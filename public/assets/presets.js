/* Shared presets for the dashboard: themes, time zones, religion text templates,
   and the default config for a new invitation. */
(() => {
  'use strict';

  const religions = {
    islam: {
      label: 'Islam',
      ceremony: { id: 'Akad Nikah', en: 'Wedding Ceremony (Akad)' },
      opening: {
        id: "Assalamu'alaikum Warahmatullahi Wabarakatuh. Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:",
        en: 'With the blessing of Allah, we joyfully invite you to celebrate the marriage of:'
      },
      quote: {
        text: {
          id: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.',
          en: 'And among His signs is that He created for you mates from among yourselves, that you may find tranquility in them; and He placed between you affection and mercy.'
        },
        source: 'QS. Ar-Rum: 21'
      },
      closing: {
        id: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Wassalamu'alaikum Warahmatullahi Wabarakatuh.",
        en: 'It would be an honour and a joy for us if you could attend and give us your blessing.'
      }
    },
    kristen: {
      label: 'Kristen',
      ceremony: { id: 'Pemberkatan Nikah', en: 'Holy Matrimony' },
      opening: {
        id: 'Salam sejahtera dalam kasih Tuhan Yesus Kristus. Dengan penuh sukacita dan atas berkat Tuhan, kami bermaksud mengundang Bapak/Ibu/Saudara/i dalam pernikahan kami:',
        en: 'By the grace of God, we joyfully invite you to celebrate the marriage of:'
      },
      quote: {
        text: {
          id: 'Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.',
          en: 'So they are no longer two, but one flesh. Therefore what God has joined together, let no one separate.'
        },
        source: 'Matius 19:6'
      },
      closing: {
        id: 'Merupakan suatu kehormatan dan sukacita bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Tuhan Yesus memberkati.',
        en: 'It would be an honour and a joy for us if you could attend and bless us. God bless you.'
      }
    },
    katolik: {
      label: 'Katolik',
      ceremony: { id: 'Sakramen Pernikahan', en: 'Holy Matrimony' },
      opening: {
        id: 'Salam damai dalam Kristus. Atas berkat rahmat Tuhan, kami bermaksud menyelenggarakan Sakramen Pernikahan putra-putri kami:',
        en: 'By the grace of God, we joyfully invite you to the Sacrament of Holy Matrimony of:'
      },
      quote: {
        text: {
          id: 'Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong.',
          en: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.'
        },
        source: '1 Korintus 13:4'
      },
      closing: {
        id: 'Merupakan suatu kehormatan dan sukacita bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Berkah Dalem.',
        en: 'It would be an honour and a joy for us if you could attend and bless us. God bless you.'
      }
    },
    hindu: {
      label: 'Hindu',
      ceremony: { id: 'Upacara Pawiwahan', en: 'Wedding Ceremony' },
      opening: {
        id: 'Om Swastyastu. Atas Asung Kertha Wara Nugraha Ida Sang Hyang Widhi Wasa, kami bermaksud mengundang Bapak/Ibu/Saudara/i pada upacara pernikahan putra-putri kami:',
        en: 'By the grace of Ida Sang Hyang Widhi Wasa, we joyfully invite you to the wedding of:'
      },
      quote: {
        text: {
          id: 'Semoga kalian tetap bersatu dan tidak pernah terpisahkan, mencapai umur panjang, dan bersama anak cucu hidup bahagia di rumah sendiri.',
          en: 'Be ye not parted; dwell ye here; reach the full time of human life. With sons and grandsons sport and play, rejoicing in your own abode.'
        },
        source: 'Rgveda X.85.42'
      },
      closing: {
        id: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Om Shanti Shanti Shanti Om.',
        en: 'It would be an honour and a joy for us if you could attend and give us your blessing. Om Shanti Shanti Shanti Om.'
      }
    },
    buddha: {
      label: 'Buddha',
      ceremony: { id: 'Pemberkatan Pernikahan', en: 'Wedding Blessing' },
      opening: {
        id: 'Namo Buddhaya. Dengan berkah Tiratana, kami bermaksud mengundang Bapak/Ibu/Saudara/i pada pernikahan putra-putri kami:',
        en: 'With the blessing of the Triple Gem, we joyfully invite you to the wedding of:'
      },
      quote: {
        text: {
          id: 'Jika suami dan istri ingin bersama dalam kehidupan ini dan kehidupan yang akan datang, keduanya hendaknya memiliki keyakinan, moralitas, kedermawanan, dan kebijaksanaan yang setara.',
          en: 'If both husband and wife wish to see one another in this life and the next, they should have the same faith, the same virtue, the same generosity, the same wisdom.'
        },
        source: 'Samajivina Sutta (AN 4.55)'
      },
      closing: {
        id: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Sabbe satta bhavantu sukhitatta.',
        en: 'It would be an honour and a joy for us if you could attend. May all beings be happy.'
      }
    },
    umum: {
      label: 'Umum / Universal',
      ceremony: { id: 'Upacara Pernikahan', en: 'Wedding Ceremony' },
      opening: {
        id: 'Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk merayakan pernikahan kami:',
        en: 'With great joy, we invite you to celebrate the wedding of:'
      },
      quote: {
        text: {
          id: 'Cinta tidak membuat dunia berputar. Cinta adalah yang membuat perjalanan itu berarti.',
          en: 'Love doesn’t make the world go round. Love is what makes the ride worthwhile.'
        },
        source: 'Franklin P. Jones'
      },
      closing: {
        id: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
        en: 'It would be an honour and a joy for us if you could join us on our special day.'
      }
    }
  };

  const themes = [
    { id: 'sage', label: 'Sage', colors: ['#6b7b5b', '#b8955a', '#f4f1e8'] },
    { id: 'navy', label: 'Navy', colors: ['#2a3b5c', '#c2a36b', '#f3f1ec'] },
    { id: 'terracotta', label: 'Terracotta', colors: ['#a85d3e', '#6f7f5c', '#f7efe6'] },
    { id: 'blush', label: 'Blush', colors: ['#b07c80', '#b59a64', '#faf3f1'] },
    { id: 'noir', label: 'Noir', colors: ['#15161a', '#c9a96e', '#2a2c32'] }
  ];

  const timeZones = [
    { id: 'Asia/Jakarta', label: 'WIB — Jakarta, Sumatra, Jawa, Kalbar, Kalteng', offset: '+07:00', short: 'WIB' },
    { id: 'Asia/Makassar', label: 'WITA — Bali, NTB, NTT, Sulawesi, Kalsel, Kaltim', offset: '+08:00', short: 'WITA' },
    { id: 'Asia/Jayapura', label: 'WIT — Maluku, Papua', offset: '+09:00', short: 'WIT' }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function newConfig({ groom, bride, date, religion = 'islam', theme = 'sage', timeZone = 'Asia/Jakarta' }) {
    const preset = religions[religion] || religions.umum;
    const tz = timeZones.find((z) => z.id === timeZone) || timeZones[0];
    const day = (date || '').slice(0, 10);
    const at = (time) => (day ? `${day}T${time}:00${tz.offset}` : '');
    const deadline = day ? new Date(new Date(day).getTime() - 10 * 86400000).toISOString().slice(0, 10) : '';
    return {
      theme,
      defaultLang: 'id',
      timeZone: tz.id,
      timeZoneLabel: tz.short,
      religion,
      couple: {
        groom: { nickname: groom, fullName: groom, parents: { id: 'Putra dari Bapak ... & Ibu ...', en: '' }, instagram: '', photo: '' },
        bride: { nickname: bride, fullName: bride, parents: { id: 'Putri dari Bapak ... & Ibu ...', en: '' }, instagram: '', photo: '' }
      },
      brideFirst: false,
      heroPhoto: '',
      hashtag: `#${groom}${bride}`.replace(/\s+/g, ''),
      weddingDate: date ? `${date.slice(0, 16)}:00${tz.offset}` : '',
      opening: clone(preset.opening),
      quote: clone(preset.quote),
      events: [
        {
          title: clone(preset.ceremony),
          start: at('08:00'), end: at('10:00'),
          venue: '', address: '', mapsQuery: '', mapsUrl: ''
        },
        {
          title: { id: 'Resepsi', en: 'Reception' },
          start: at('11:00'), end: at('14:00'),
          venue: '', address: '', mapsQuery: '', mapsUrl: ''
        }
      ],
      livestream: { enabled: false, platform: 'YouTube Live', url: '' },
      dressCode: { enabled: false, colors: ['#7d8b6a', '#e9dfcc', '#b8955a'], note: { id: '', en: '' } },
      story: [],
      gallery: [],
      rsvp: { enabled: true, deadline, defaultPax: 2, whatsapp: '' },
      gifts: { enabled: true, accounts: [], qrisImage: '', address: { recipient: '', phone: '', text: '' } },
      music: { url: '', builtIn: true },
      closing: clone(preset.closing),
      admin: { waTemplate: '', waReminder: '', notifyEmail: false }
    };
  }

  const defaultWaTemplate = [
    'Kepada Yth.',
    'Bapak/Ibu/Saudara/i',
    '*{nama}*',
    '',
    'Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:',
    '',
    '*{pasangan}*',
    '{tanggal}',
    '',
    'Info lengkap acara, lokasi, dan konfirmasi kehadiran dapat dilihat melalui tautan berikut:',
    '{link}',
    '',
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
    '',
    'Terima kasih.',
    'Kami yang berbahagia,',
    '*{pasangan}*'
  ].join('\n');

  const defaultWaReminder = [
    'Halo *{nama}* 🙏',
    '',
    'Mengingatkan kembali undangan pernikahan kami, *{pasangan}*, pada {tanggal}.',
    '',
    'Mohon kesediaannya untuk mengonfirmasi kehadiran melalui tautan berikut:',
    '{link}',
    '',
    'Terima kasih banyak!'
  ].join('\n');

  window.PRESETS = { religions, themes, timeZones, newConfig, defaultWaTemplate, defaultWaReminder };
})();
