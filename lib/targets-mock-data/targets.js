module.exports = [
  {
    id: '1',
    url: 'http://example.com',
    value: '1.50',
    maxAcceptsPerDay: '10',
    accept: {
      geoState: {
        $in: ['ca', 'ny']
      },
      hour: {
        $in: ['13', '14', '15']
      }
    }
  },
  {
    id: '2',
    url: 'http://2.com',
    value: '0.60',
    maxAcceptsPerDay: '8',
    accept: {
      geoState: {
        $in: ['ca', 'ny']
      },
      hour: {
        $in: ['13', '14', '15']
      }
    }
  },
  {
    id: '3',
    url: 'http://cba.com',
    value: '0.80',
    maxAcceptsPerDay: '2',
    accept: {
      geoState: {
        $in: ['la', 'tx']
      },
      hour: {
        $in: ['16', '17', '18']
      }
    }
  },
  {
    id: '4',
    url: 'http://dca.com',
    value: '0.80',
    maxAcceptsPerDay: '4',
    accept: {
      geoState: {
        $in: ['ca', 'ny']
      },
      hour: {
        $in: ['13', '14', '15']
      }
    }
  }
]
